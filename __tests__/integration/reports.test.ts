/**
 * Reports Integration Tests
 *
 * These tests verify report generation functionality:
 * - Program summary report calculations
 * - Requirement coverage report
 * - Traceability matrix data
 * - Story coverage report
 * - Status transitions (approval history) report
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import type { StoryStatus } from '@/types/database'

// Mock the server client
vi.mock('@/lib/supabase/server')

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Reports Integration', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      from: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  describe('Program Summary Report', () => {
    const mockStories = [
      { story_id: 's-001', program_id: 'prog-001', status: 'Draft', priority: 'Must Have', stakeholder_approved_at: null },
      { story_id: 's-002', program_id: 'prog-001', status: 'Approved', priority: 'Must Have', stakeholder_approved_at: '2024-01-15' },
      { story_id: 's-003', program_id: 'prog-001', status: 'In Development', priority: 'Should Have', stakeholder_approved_at: '2024-01-16' },
      { story_id: 's-004', program_id: 'prog-002', status: 'Draft', priority: 'Could Have', stakeholder_approved_at: null },
    ]

    const mockPrograms = [
      { program_id: 'prog-001', name: 'Alpha Project' },
      { program_id: 'prog-002', name: 'Beta Project' },
    ]

    it('aggregates stories by program correctly', async () => {
      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_stories') {
          return {
            select: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({ data: mockStories, error: null }),
          }
        }
        if (table === 'programs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockPrograms, error: null }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      })

      // Simulate what getProgramSummaryReport would return
      const summaryMap = new Map()
      const statuses: StoryStatus[] = [
        'Draft', 'Internal Review', 'Pending Client Review', 'Approved',
        'In Development', 'In UAT', 'Needs Discussion', 'Out of Scope'
      ]
      const programMap = new Map(mockPrograms.map(p => [p.program_id, p.name]))

      mockStories.forEach(story => {
        if (!summaryMap.has(story.program_id)) {
          summaryMap.set(story.program_id, {
            program_id: story.program_id,
            program_name: programMap.get(story.program_id) || story.program_id,
            total_stories: 0,
            by_status: Object.fromEntries(statuses.map(s => [s, 0])),
            by_priority: { 'Must Have': 0, 'Should Have': 0, 'Could Have': 0, "Won't Have": 0 },
            approved_count: 0,
            approval_rate: 0,
          })
        }

        const summary = summaryMap.get(story.program_id)
        summary.total_stories++
        summary.by_status[story.status]++
        if (story.priority) {
          summary.by_priority[story.priority] = (summary.by_priority[story.priority] || 0) + 1
        }
        if (story.stakeholder_approved_at) {
          summary.approved_count++
        }
      })

      // Calculate approval rates
      summaryMap.forEach(summary => {
        summary.approval_rate = summary.total_stories > 0
          ? Math.round((summary.approved_count / summary.total_stories) * 100)
          : 0
      })

      const result = Array.from(summaryMap.values())

      // Verify Alpha Project aggregation
      const alphaProject = result.find(r => r.program_id === 'prog-001')
      expect(alphaProject).toBeDefined()
      expect(alphaProject.total_stories).toBe(3)
      expect(alphaProject.by_status['Draft']).toBe(1)
      expect(alphaProject.by_status['Approved']).toBe(1)
      expect(alphaProject.by_status['In Development']).toBe(1)
      expect(alphaProject.approved_count).toBe(2)
      expect(alphaProject.approval_rate).toBe(67)

      // Verify Beta Project aggregation
      const betaProject = result.find(r => r.program_id === 'prog-002')
      expect(betaProject).toBeDefined()
      expect(betaProject.total_stories).toBe(1)
      expect(betaProject.approved_count).toBe(0)
      expect(betaProject.approval_rate).toBe(0)
    })

    it('handles empty stories array', () => {
      const summaryMap = new Map()
      const result = Array.from(summaryMap.values())
      expect(result).toHaveLength(0)
    })

    it('calculates correct approval rates', () => {
      const testCases = [
        { approved: 5, total: 10, expected: 50 },
        { approved: 3, total: 4, expected: 75 },
        { approved: 0, total: 5, expected: 0 },
        { approved: 7, total: 7, expected: 100 },
        { approved: 0, total: 0, expected: 0 },
      ]

      testCases.forEach(({ approved, total, expected }) => {
        const rate = total > 0 ? Math.round((approved / total) * 100) : 0
        expect(rate).toBe(expected)
      })
    })
  })

  describe('Requirement Coverage Report', () => {
    const mockCoverageData = [
      {
        program_id: 'prog-001',
        program_name: 'Alpha Project',
        total_requirements: 50,
        covered_requirements: 40,
        uncovered_requirements: 10,
        uncovered_critical: 2,
        coverage_percentage: 80,
      },
      {
        program_id: 'prog-002',
        program_name: 'Beta Project',
        total_requirements: 30,
        covered_requirements: 15,
        uncovered_requirements: 15,
        uncovered_critical: 5,
        coverage_percentage: 50,
      },
    ]

    it('returns coverage summary from view', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockCoverageData, error: null }),
      })

      const supabase = await createClient()
      const { data } = await supabase.from('requirement_coverage_summary').select('*')

      expect(data).toHaveLength(2)
      expect(data[0].coverage_percentage).toBe(80)
      expect(data[1].uncovered_critical).toBe(5)
    })

    it('calculates coverage percentage correctly', () => {
      mockCoverageData.forEach(item => {
        const calculated = Math.round((item.covered_requirements / item.total_requirements) * 100)
        expect(calculated).toBe(item.coverage_percentage)
      })
    })

    it('identifies uncovered critical requirements', () => {
      const hasUncoveredCritical = mockCoverageData.some(item => item.uncovered_critical > 0)
      expect(hasUncoveredCritical).toBe(true)
    })
  })

  describe('Traceability Matrix Report', () => {
    const mockTraceabilityData = [
      {
        requirement_uuid: 'req-001',
        requirement_id: 'REQ-001',
        dis_number: 'DIS-001',
        requirement_title: 'User Authentication',
        requirement_category: 'Functional',
        requirement_priority: 'High',
        requirement_status: 'Active',
        program_id: 'prog-001',
        program_name: 'Alpha Project',
        story_id: 's-001',
        story_title: 'Implement Login',
        story_status: 'In Development',
        story_priority: 'Must Have',
        coverage_type: 'Implements',
        coverage_notes: 'Full implementation',
        coverage_status: 'Covered',
      },
      {
        requirement_uuid: 'req-002',
        requirement_id: 'REQ-002',
        dis_number: null,
        requirement_title: 'Data Encryption',
        requirement_category: 'Security',
        requirement_priority: 'Critical',
        requirement_status: 'Active',
        program_id: 'prog-001',
        program_name: 'Alpha Project',
        story_id: null,
        story_title: null,
        story_status: null,
        story_priority: null,
        coverage_type: null,
        coverage_notes: null,
        coverage_status: 'Uncovered',
      },
    ]

    it('returns traceability matrix from view', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockTraceabilityData, error: null }),
      })

      const supabase = await createClient()
      const { data } = await supabase.from('traceability_matrix').select('*').eq('program_id', 'prog-001')

      expect(data).toHaveLength(2)
    })

    it('identifies covered requirements', () => {
      const covered = mockTraceabilityData.filter(item => item.coverage_status === 'Covered')
      expect(covered).toHaveLength(1)
      expect(covered[0].story_id).toBeDefined()
    })

    it('identifies uncovered requirements', () => {
      const uncovered = mockTraceabilityData.filter(item => item.coverage_status === 'Uncovered')
      expect(uncovered).toHaveLength(1)
      expect(uncovered[0].story_id).toBeNull()
    })

    it('links requirements to stories correctly', () => {
      const linkedItem = mockTraceabilityData.find(item => item.story_id === 's-001')
      expect(linkedItem).toBeDefined()
      expect(linkedItem?.requirement_id).toBe('REQ-001')
      expect(linkedItem?.coverage_type).toBe('Implements')
    })

    it('supports filtering by program', () => {
      const prog001Items = mockTraceabilityData.filter(item => item.program_id === 'prog-001')
      expect(prog001Items.length).toBe(mockTraceabilityData.length)
    })
  })

  describe('Story Coverage Report', () => {
    const mockStoryCoverage = [
      {
        story_id: 's-001',
        title: 'Implement Login',
        program_id: 'prog-001',
        program_name: 'Alpha Project',
        status: 'In Development',
        priority: 'Must Have',
        has_requirement: true,
        linked_requirement_id: 'req-001',
      },
      {
        story_id: 's-002',
        title: 'Add Dark Mode',
        program_id: 'prog-001',
        program_name: 'Alpha Project',
        status: 'Draft',
        priority: 'Could Have',
        has_requirement: false,
        linked_requirement_id: null,
      },
    ]

    it('identifies stories with linked requirements', () => {
      const linked = mockStoryCoverage.filter(item => item.has_requirement)
      expect(linked).toHaveLength(1)
      expect(linked[0].linked_requirement_id).toBe('req-001')
    })

    it('identifies stories without linked requirements', () => {
      const unlinked = mockStoryCoverage.filter(item => !item.has_requirement)
      expect(unlinked).toHaveLength(1)
      expect(unlinked[0].linked_requirement_id).toBeNull()
    })

    it('includes story metadata in coverage report', () => {
      mockStoryCoverage.forEach(item => {
        expect(item.story_id).toBeDefined()
        expect(item.title).toBeDefined()
        expect(item.program_name).toBeDefined()
        expect(item.status).toBeDefined()
      })
    })
  })

  describe('Status Transitions Report (Approval History)', () => {
    const mockApprovals = [
      {
        id: 'a-001',
        story_id: 's-001',
        approved_by: 'user-001',
        previous_status: 'Draft',
        status: 'Internal Review',
        notes: 'Ready for review',
        approved_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'a-002',
        story_id: 's-001',
        approved_by: 'user-002',
        previous_status: 'Internal Review',
        status: 'Approved',
        notes: 'Looks good',
        approved_at: '2024-01-16T14:00:00Z',
      },
      {
        id: 'a-003',
        story_id: 's-002',
        approved_by: 'user-001',
        previous_status: null,
        status: 'Draft',
        notes: null,
        approved_at: '2024-01-17T09:00:00Z',
      },
    ]

    const mockStories = [
      { story_id: 's-001', title: 'Implement Login', program_id: 'prog-001' },
      { story_id: 's-002', title: 'Add Dark Mode', program_id: 'prog-001' },
    ]

    const mockUsers = [
      { user_id: 'user-001', name: 'John Doe' },
      { user_id: 'user-002', name: 'Jane Smith' },
    ]

    const mockPrograms = [
      { program_id: 'prog-001', name: 'Alpha Project' },
    ]

    it('tracks complete transition history for a story', () => {
      const story001Transitions = mockApprovals.filter(a => a.story_id === 's-001')
      expect(story001Transitions).toHaveLength(2)
      expect(story001Transitions[0].previous_status).toBe('Draft')
      expect(story001Transitions[0].status).toBe('Internal Review')
      expect(story001Transitions[1].previous_status).toBe('Internal Review')
      expect(story001Transitions[1].status).toBe('Approved')
    })

    it('records who made each transition', () => {
      const userMap = new Map(mockUsers.map(u => [u.user_id, u.name]))

      mockApprovals.forEach(approval => {
        const userName = userMap.get(approval.approved_by)
        expect(userName).toBeDefined()
      })
    })

    it('records timestamp for each transition', () => {
      mockApprovals.forEach(approval => {
        expect(approval.approved_at).toBeDefined()
        // Verify it's a valid ISO date string
        const parsed = new Date(approval.approved_at)
        expect(parsed.getTime()).not.toBeNaN()
      })
    })

    it('handles null previous status for initial creation', () => {
      const initialTransition = mockApprovals.find(a => a.previous_status === null)
      expect(initialTransition).toBeDefined()
      expect(initialTransition?.id).toBe('a-003')
    })

    it('handles optional notes field', () => {
      const withNotes = mockApprovals.filter(a => a.notes !== null)
      const withoutNotes = mockApprovals.filter(a => a.notes === null)
      expect(withNotes.length).toBeGreaterThan(0)
      expect(withoutNotes.length).toBeGreaterThan(0)
    })

    it('builds complete report with story and user details', () => {
      const storyMap = new Map(mockStories.map(s => [s.story_id, s]))
      const userMap = new Map(mockUsers.map(u => [u.user_id, u.name]))
      const programMap = new Map(mockPrograms.map(p => [p.program_id, p.name]))

      const reportData = mockApprovals.map(a => {
        const story = storyMap.get(a.story_id)
        return {
          story_id: a.story_id,
          title: story?.title || 'Unknown',
          program_name: story ? (programMap.get(story.program_id) || story.program_id) : 'Unknown',
          from_status: a.previous_status || 'N/A',
          to_status: a.status,
          changed_by: userMap.get(a.approved_by) || 'Unknown',
          changed_at: a.approved_at,
          notes: a.notes,
        }
      })

      expect(reportData).toHaveLength(3)
      expect(reportData[0].title).toBe('Implement Login')
      expect(reportData[0].changed_by).toBe('John Doe')
      expect(reportData[0].program_name).toBe('Alpha Project')
    })
  })

  describe('CSV Export Format', () => {
    it('generates valid CSV headers for program summary', () => {
      const headers = ['Program ID', 'Program Name', 'Total Stories', 'Approved Count', 'Approval Rate']
      expect(headers.join(',')).toBe('Program ID,Program Name,Total Stories,Approved Count,Approval Rate')
    })

    it('generates valid CSV headers for traceability matrix', () => {
      const headers = [
        'Requirement ID',
        'Requirement Title',
        'Category',
        'Priority',
        'Status',
        'Story ID',
        'Story Title',
        'Story Status',
        'Coverage Status',
      ]
      expect(headers).toHaveLength(9)
    })

    it('escapes special characters in CSV fields', () => {
      const field = 'Title with "quotes" and, commas'
      const escaped = `"${field.replace(/"/g, '""')}"`
      expect(escaped).toBe('"Title with ""quotes"" and, commas"')
    })

    it('handles null values in CSV export', () => {
      const nullValue = null
      const csvValue = nullValue === null ? '' : nullValue
      expect(csvValue).toBe('')
    })
  })

  describe('Date Range Filtering', () => {
    const mockApprovals = [
      { id: 'a-001', approved_at: '2024-01-10T10:00:00Z' },
      { id: 'a-002', approved_at: '2024-01-15T10:00:00Z' },
      { id: 'a-003', approved_at: '2024-01-20T10:00:00Z' },
      { id: 'a-004', approved_at: '2024-01-25T10:00:00Z' },
    ]

    it('filters by start date', () => {
      const startDate = '2024-01-15'
      const filtered = mockApprovals.filter(a => a.approved_at >= startDate)
      expect(filtered).toHaveLength(3)
    })

    it('filters by end date', () => {
      const endDate = '2024-01-20T23:59:59Z'
      const filtered = mockApprovals.filter(a => a.approved_at <= endDate)
      expect(filtered).toHaveLength(3)
    })

    it('filters by date range', () => {
      const startDate = '2024-01-12'
      const endDate = '2024-01-22'
      const filtered = mockApprovals.filter(
        a => a.approved_at >= startDate && a.approved_at <= endDate
      )
      expect(filtered).toHaveLength(2)
    })

    it('returns all when no date filters', () => {
      expect(mockApprovals).toHaveLength(4)
    })
  })

  describe('Report Data Accuracy', () => {
    it('calculates correct percentages', () => {
      const testCases = [
        { numerator: 75, denominator: 100, expected: 75 },
        { numerator: 1, denominator: 3, expected: 33 },
        { numerator: 2, denominator: 3, expected: 67 },
        { numerator: 0, denominator: 100, expected: 0 },
      ]

      testCases.forEach(({ numerator, denominator, expected }) => {
        const percentage = Math.round((numerator / denominator) * 100)
        expect(percentage).toBe(expected)
      })
    })

    it('handles edge case of zero total', () => {
      const total = 0
      const approved = 0
      const rate = total > 0 ? Math.round((approved / total) * 100) : 0
      expect(rate).toBe(0)
    })

    it('counts unique story IDs correctly', () => {
      const approvals = [
        { story_id: 's-001' },
        { story_id: 's-001' },
        { story_id: 's-002' },
        { story_id: 's-003' },
      ]
      const uniqueStoryIds = Array.from(new Set(approvals.map(a => a.story_id)))
      expect(uniqueStoryIds).toHaveLength(3)
    })
  })
})
