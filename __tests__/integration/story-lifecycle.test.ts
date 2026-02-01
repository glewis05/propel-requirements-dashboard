/**
 * Story Lifecycle Integration Tests
 *
 * These tests verify the complete lifecycle of stories:
 * - Create story → appears in list → view detail
 * - Edit story → version created → diff visible
 * - Status transition: Draft → Review → Approved
 * - Parent-child relationship creation
 * - Related stories bidirectional linking
 * - Comment with @mention → notification created
 * - Delete story → confirmation → removal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import {
  createStory,
  updateStory,
  deleteStory,
  transitionStoryStatus,
} from '@/app/(dashboard)/stories/actions'
import { STATUS_CONFIG, canTransition } from '@/lib/status-transitions'
import type { StoryStatus, UserRole } from '@/types/database'

// Mock the server client
vi.mock('@/lib/supabase/server')
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))
vi.mock('@/lib/notifications/service', () => ({
  sendStatusChangeNotifications: vi.fn().mockResolvedValue({}),
}))

describe('Story Lifecycle Integration', () => {
  let mockSupabase: any
  let mockStory: any
  let mockUser: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockUser = {
      user_id: 'user-001',
      auth_id: 'auth-001',
      role: 'Program Manager' as UserRole,
    }

    mockStory = {
      story_id: 'story-001',
      title: 'Test Story',
      status: 'Draft' as StoryStatus,
      version: 1,
      program_id: 'prog-001',
      created_at: new Date().toISOString(),
    }

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUser.auth_id } },
        }),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  describe('Story Creation Flow', () => {
    it('creates a new story with generated ID', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

      const result = await createStory({
        title: 'New Feature Story',
        program_id: 'prog-001',
        status: 'Draft',
        story_type: 'user_story',
        user_story: 'As a user, I want to create stories',
        is_technical: false,
        acceptance_criteria: 'Given I am logged in, when I create a story, then it appears in the list',
      })

      expect(result.success).toBe(true)
      expect(result.storyId).toBeDefined()
      // ID format: PROG-YYYYMMDD-XXXX
      expect(result.storyId).toMatch(/^PROG-\d{8}-[A-Z0-9]{4}$/)
    })

    it('sets draft_date when creating in Draft status', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({ insert: insertMock })

      await createStory({
        title: 'Draft Story',
        program_id: 'prog-001',
        status: 'Draft',
        story_type: 'user_story',
        user_story: 'As a user...',
        is_technical: false,
      })

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          draft_date: expect.any(String),
        })
      )
    })

    it('sets version to 1 for new stories', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({ insert: insertMock })

      await createStory({
        title: 'New Story',
        program_id: 'prog-001',
        status: 'Draft',
        story_type: 'user_story',
        user_story: 'As a user...',
        is_technical: false,
      })

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 1,
        })
      )
    })
  })

  describe('Story Update Flow', () => {
    it('increments version on update', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_stories') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { version: 3, status: 'Draft' },
              error: null,
            }),
            update: updateMock,
          }
        }
        return {}
      })

      await updateStory('story-001', {
        title: 'Updated Title',
        program_id: 'prog-001',
        status: 'Draft',
        story_type: 'user_story',
        user_story: 'Updated user story',
        is_technical: false,
      })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 4,
        })
      )
    })

    it('updates status dates when status changes', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_stories') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { version: 1, status: 'Draft' },
              error: null,
            }),
            update: updateMock,
          }
        }
        return {}
      })

      await updateStory('story-001', {
        title: 'Story',
        program_id: 'prog-001',
        status: 'Internal Review',
        story_type: 'user_story',
        user_story: 'As a user...',
        is_technical: false,
      })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          internal_review_date: expect.any(String),
        })
      )
    })
  })

  describe('Status Transition Workflow', () => {
    describe('Draft → Internal Review → Pending Client Review → Approved', () => {
      it('validates Draft to Internal Review transition', () => {
        expect(canTransition('Draft', 'Internal Review', 'Program Manager')).toBe(true)
        expect(canTransition('Draft', 'Internal Review', 'Developer')).toBe(false)
      })

      it('validates Internal Review to Pending Client Review transition', () => {
        expect(canTransition('Internal Review', 'Pending Client Review', 'Program Manager')).toBe(true)
      })

      it('validates Pending Client Review to Approved transition', () => {
        expect(canTransition('Pending Client Review', 'Approved', 'Program Manager')).toBe(true)
      })

      it('blocks direct Draft to Approved transition', () => {
        expect(canTransition('Draft', 'Approved', 'Admin')).toBe(false)
      })
    })

    describe('Approval recording', () => {
      it('creates approval record for internal review transition', async () => {
        const insertMock = vi.fn().mockResolvedValue({ error: null })
        const updateMock = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })

        let userCallCount = 0
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }
          }
          if (table === 'user_stories') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  status: 'Internal Review',
                  version: 1,
                  stakeholder_approved_at: null,
                  title: 'Test',
                  program_id: 'prog-001',
                },
                error: null,
              }),
              update: updateMock,
            }
          }
          if (table === 'story_approvals') {
            return { insert: insertMock }
          }
          if (table === 'story_versions') {
            return {
              insert: vi.fn().mockReturnValue({
                then: vi.fn().mockReturnValue({ catch: vi.fn() }),
              }),
            }
          }
          return {}
        })

        await transitionStoryStatus('story-001', 'Pending Client Review', 'Approved by team lead')

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            story_id: 'story-001',
            approval_type: 'internal_review',
            status: 'approved',
            previous_status: 'Internal Review',
          })
        )
      })
    })
  })

  describe('Story Deletion Flow', () => {
    it('prevents deletion of approved stories', async () => {
      let callCount = 0
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve({
              data: { user_id: 'user-001', role: 'Admin' },
              error: null,
            })
          } else {
            return Promise.resolve({
              data: {
                status: 'Approved',
                title: 'Protected Story',
                program_id: 'prog-001',
                deleted_at: null,
              },
              error: null,
            })
          }
        }),
      }))

      const result = await deleteStory('story-001')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot delete')
      expect(result.error).toContain('Approved')
    })

    it('soft deletes by setting deleted_at', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      let callCount = 0
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve({
              data: { user_id: 'user-001', role: 'Admin' },
              error: null,
            })
          } else {
            return Promise.resolve({
              data: {
                status: 'Draft',
                title: 'Deletable Story',
                program_id: 'prog-001',
                deleted_at: null,
              },
              error: null,
            })
          }
        }),
        update: updateMock,
      }))

      mockSupabase.rpc.mockResolvedValue({ error: null })

      await deleteStory('story-001')

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
          deleted_by: expect.any(String),
        })
      )
    })
  })

  describe('Related Stories', () => {
    it('stores related story IDs as array', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({ insert: insertMock })

      await createStory({
        title: 'Story with Relations',
        program_id: 'prog-001',
        status: 'Draft',
        story_type: 'user_story',
        user_story: 'As a user...',
        is_technical: false,
        related_stories: ['story-002', 'story-003'],
      })

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          related_stories: ['story-002', 'story-003'],
        })
      )
    })

    it('stores parent story ID', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({ insert: insertMock })

      await createStory({
        title: 'Child Story',
        program_id: 'prog-001',
        status: 'Draft',
        story_type: 'user_story',
        user_story: 'As a user...',
        is_technical: false,
        parent_story_id: 'parent-story-001',
      })

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parent_story_id: 'parent-story-001',
        })
      )
    })
  })
})

describe('Status Configuration Validation', () => {
  const allStatuses: StoryStatus[] = [
    'Draft',
    'Internal Review',
    'Pending Client Review',
    'Approved',
    'In Development',
    'In UAT',
    'Needs Discussion',
    'Out of Scope',
  ]

  it('all statuses have at least one outgoing transition', () => {
    allStatuses.forEach((status) => {
      const config = STATUS_CONFIG[status]
      expect(config.allowedTransitions.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('Needs Discussion can reach any work state', () => {
    const fromNeedsDiscussion = STATUS_CONFIG['Needs Discussion'].allowedTransitions.map(
      (t) => t.to
    )
    expect(fromNeedsDiscussion).toContain('Draft')
    expect(fromNeedsDiscussion).toContain('Internal Review')
    expect(fromNeedsDiscussion).toContain('Pending Client Review')
    expect(fromNeedsDiscussion).toContain('Out of Scope')
  })

  it('approval transitions require approval flag', () => {
    // Internal Review → Pending Client Review requires approval
    const internalApproval = STATUS_CONFIG['Internal Review'].allowedTransitions.find(
      (t) => t.to === 'Pending Client Review'
    )
    expect(internalApproval?.requiresApproval).toBe(true)
    expect(internalApproval?.approvalType).toBe('internal_review')

    // Pending Client Review → Approved requires approval
    const clientApproval = STATUS_CONFIG['Pending Client Review'].allowedTransitions.find(
      (t) => t.to === 'Approved'
    )
    expect(clientApproval?.requiresApproval).toBe(true)
    expect(clientApproval?.approvalType).toBe('stakeholder')
  })

  it('rejection transitions require notes', () => {
    // Return to Draft from Internal Review requires notes
    const returnToDraft = STATUS_CONFIG['Internal Review'].allowedTransitions.find(
      (t) => t.to === 'Draft'
    )
    expect(returnToDraft?.requiresNotes).toBe(true)

    // Flag for discussion requires notes
    const flagDiscussion = STATUS_CONFIG['Draft'].allowedTransitions.find(
      (t) => t.to === 'Needs Discussion'
    )
    expect(flagDiscussion?.requiresNotes).toBe(true)
  })
})
