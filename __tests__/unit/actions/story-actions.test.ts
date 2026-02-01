import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import {
  createStory,
  updateStory,
  deleteStory,
  transitionStoryStatus,
} from '@/app/(dashboard)/stories/actions'

// Mock the server client
vi.mock('@/lib/supabase/server')

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock notifications service
vi.mock('@/lib/notifications/service', () => ({
  sendStatusChangeNotifications: vi.fn().mockResolvedValue({}),
}))

describe('createStory', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await createStory({
      title: 'Test Story',
      program_id: 'prog-001',
      status: 'Draft',
      story_type: 'user_story',
      user_story: 'As a user...',
      is_technical: false,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('creates story when authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from.mockReturnValue({
      insert: insertMock,
    })

    const result = await createStory({
      title: 'Test Story',
      program_id: 'prog-001',
      status: 'Draft',
      story_type: 'user_story',
      user_story: 'As a user...',
      is_technical: false,
    })

    expect(result.success).toBe(true)
    expect(result.storyId).toBeDefined()
    expect(mockSupabase.from).toHaveBeenCalledWith('user_stories')
    expect(insertMock).toHaveBeenCalled()
  })

  it('generates correct story ID format', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })

    const result = await createStory({
      title: 'Test Story',
      program_id: 'test-program',
      status: 'Draft',
      story_type: 'user_story',
      user_story: 'As a user...',
      is_technical: false,
    })

    expect(result.success).toBe(true)
    // Story ID format: PROG-YYYYMMDD-XXXX
    expect(result.storyId).toMatch(/^TEST-\d{8}-[A-Z0-9]{4}$/)
  })

  it('returns error on database failure', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
    })

    const result = await createStory({
      title: 'Test Story',
      program_id: 'prog-001',
      status: 'Draft',
      story_type: 'user_story',
      user_story: 'As a user...',
      is_technical: false,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Database error')
  })

  it('handles story_versions trigger error with helpful message', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        error: { message: 'Error in story_versions trigger' },
      }),
    })

    const result = await createStory({
      title: 'Test Story',
      program_id: 'prog-001',
      status: 'Draft',
      story_type: 'user_story',
      user_story: 'As a user...',
      is_technical: false,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Database trigger error')
    expect(result.error).toContain('BEFORE INSERT to AFTER INSERT')
  })
})

describe('updateStory', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await updateStory('story-001', {
      title: 'Updated Title',
      program_id: 'prog-001',
      status: 'Draft',
      story_type: 'user_story',
      user_story: 'As a user...',
      is_technical: false,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('returns error when story not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    const result = await updateStory('story-001', {
      title: 'Updated Title',
      program_id: 'prog-001',
      status: 'Draft',
      story_type: 'user_story',
      user_story: 'As a user...',
      is_technical: false,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Story not found')
  })

  it('increments version number on update', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_stories') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { version: 5, status: 'Draft' },
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
      user_story: 'As a user...',
      is_technical: false,
    })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 6,
      })
    )
  })
})

describe('deleteStory', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await deleteStory('story-001')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('only allows Admin to delete stories', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { user_id: 'user-001', role: 'Developer' },
        error: null,
      }),
    })

    const result = await deleteStory('story-001')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Only administrators can delete stories')
  })

  it('blocks deletion of Approved stories', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    let callCount = 0
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: user lookup
          return Promise.resolve({
            data: { user_id: 'user-001', role: 'Admin' },
            error: null,
          })
        } else {
          // Second call: story lookup
          return Promise.resolve({
            data: {
              status: 'Approved',
              title: 'Approved Story',
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
    expect(result.error).toContain('Cannot delete stories in "Approved" status')
  })

  it('blocks deletion of In Development stories', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
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
              status: 'In Development',
              title: 'Dev Story',
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
    expect(result.error).toContain('Cannot delete stories in "In Development" status')
  })

  it('allows Admin to delete Draft stories', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
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
              title: 'Draft Story',
              program_id: 'prog-001',
              deleted_at: null,
            },
            error: null,
          })
        }
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }))

    mockSupabase.rpc.mockResolvedValue({ error: null })

    const result = await deleteStory('story-001', 'No longer needed')

    expect(result.success).toBe(true)
  })

  it('blocks deletion of already deleted stories', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
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
              title: 'Draft Story',
              program_id: 'prog-001',
              deleted_at: '2025-01-29T10:00:00Z',
            },
            error: null,
          })
        }
      }),
    }))

    const result = await deleteStory('story-001')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Story has already been deleted')
  })
})

describe('transitionStoryStatus', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await transitionStoryStatus('story-001', 'Internal Review')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('returns error when user not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    const result = await transitionStoryStatus('story-001', 'Internal Review')

    expect(result.success).toBe(false)
    expect(result.error).toBe('User not found')
  })

  it('returns error when story not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    let callCount = 0
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // User lookup
          return Promise.resolve({
            data: { user_id: 'user-001', role: 'Program Manager' },
            error: null,
          })
        } else {
          // Story lookup
          return Promise.resolve({ data: null, error: { message: 'Not found' } })
        }
      }),
    }))

    const result = await transitionStoryStatus('story-001', 'Internal Review')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Story not found')
  })

  it('rejects unauthorized transitions', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    let callCount = 0
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // User lookup - UAT Tester cannot transition Draft
          return Promise.resolve({
            data: { user_id: 'user-001', role: 'UAT Tester' },
            error: null,
          })
        } else {
          // Story lookup
          return Promise.resolve({
            data: {
              status: 'Draft',
              version: 1,
              stakeholder_approved_at: null,
              title: 'Test',
              program_id: 'prog-001',
            },
            error: null,
          })
        }
      }),
    }))

    const result = await transitionStoryStatus('story-001', 'Internal Review')

    expect(result.success).toBe(false)
    expect(result.error).toBe('This status transition is not allowed')
  })

  it('successfully transitions status', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-001' } },
    })

    let callCount = 0
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // User lookup
          return Promise.resolve({
            data: { user_id: 'user-001', role: 'Program Manager' },
            error: null,
          })
        } else {
          // Story lookup
          return Promise.resolve({
            data: {
              status: 'Draft',
              version: 1,
              stakeholder_approved_at: null,
              title: 'Test Story',
              program_id: 'prog-001',
            },
            error: null,
          })
        }
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }))

    const result = await transitionStoryStatus('story-001', 'Internal Review')

    expect(result.success).toBe(true)
  })
})
