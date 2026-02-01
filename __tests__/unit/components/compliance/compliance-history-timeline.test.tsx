import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplianceHistoryTimeline, ComplianceHistoryCompact } from '@/components/compliance/compliance-history-timeline'
import type { ComplianceMappingHistory } from '@/types/compliance'

// Mock date-fns to have consistent relative times in tests
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    formatDistanceToNow: vi.fn((date: Date) => {
      const now = new Date('2025-01-29T15:00:00Z')
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

      if (diffHours < 1) return 'less than an hour'
      if (diffHours < 24) return `${diffHours} hours`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} days`
    }),
  }
})

describe('ComplianceHistoryTimeline', () => {
  const mockHistory: ComplianceMappingHistory[] = [
    {
      history_id: 'hist-001',
      mapping_id: 'map-001',
      action: 'created',
      previous_status: null,
      new_status: 'not_started',
      change_reason: null,
      changed_by: 'user-001',
      changed_by_name: 'John Doe',
      changed_by_email: 'john@test.com',
      ip_address: '192.168.1.1',
      created_at: '2025-01-29T10:00:00Z',
    },
    {
      history_id: 'hist-002',
      mapping_id: 'map-001',
      action: 'updated',
      previous_status: 'not_started',
      new_status: 'in_progress',
      change_reason: 'Started implementation',
      changed_by: 'user-002',
      changed_by_name: 'Jane Smith',
      changed_by_email: 'jane@test.com',
      ip_address: '192.168.1.2',
      created_at: '2025-01-29T12:00:00Z',
    },
    {
      history_id: 'hist-003',
      mapping_id: 'map-001',
      action: 'verified',
      previous_status: 'implemented',
      new_status: 'verified',
      change_reason: 'Verified during audit',
      changed_by: 'user-001',
      changed_by_name: 'John Doe',
      changed_by_email: 'john@test.com',
      ip_address: '192.168.1.1',
      created_at: '2025-01-29T14:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('shows empty message when no history', () => {
      render(<ComplianceHistoryTimeline history={[]} />)
      expect(screen.getByText('No history records found')).toBeInTheDocument()
    })
  })

  describe('rendering entries', () => {
    it('renders all history entries', () => {
      render(<ComplianceHistoryTimeline history={mockHistory} />)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('displays action labels', () => {
      render(<ComplianceHistoryTimeline history={mockHistory} />)
      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.getByText('Verified')).toBeInTheDocument()
    })

    it('shows user email in parentheses', () => {
      render(<ComplianceHistoryTimeline history={mockHistory} />)
      expect(screen.getByText('(john@test.com)')).toBeInTheDocument()
      expect(screen.getByText('(jane@test.com)')).toBeInTheDocument()
    })

    it('shows change reason when provided', () => {
      render(<ComplianceHistoryTimeline history={mockHistory} />)
      expect(screen.getByText(/Started implementation/)).toBeInTheDocument()
      expect(screen.getByText(/Verified during audit/)).toBeInTheDocument()
    })

    it('shows IP address when available', () => {
      render(<ComplianceHistoryTimeline history={mockHistory} />)
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument()
      expect(screen.getByText('192.168.1.2')).toBeInTheDocument()
    })

    it('shows status transition for updates', () => {
      render(<ComplianceHistoryTimeline history={mockHistory} />)
      // Should show "Not Started → In Progress" for the update action
      expect(screen.getByText(/Not Started → In Progress/)).toBeInTheDocument()
    })

    it('shows Verified badge for verified action', () => {
      render(<ComplianceHistoryTimeline history={mockHistory} />)
      // The Verified text appears multiple times (action label and badge)
      const verifiedTexts = screen.getAllByText('Verified')
      expect(verifiedTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('unknown user', () => {
    it('shows "Unknown" for missing user name', () => {
      const historyWithUnknown: ComplianceMappingHistory[] = [
        {
          ...mockHistory[0],
          changed_by_name: null,
        },
      ]
      render(<ComplianceHistoryTimeline history={historyWithUnknown} />)
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ComplianceHistoryTimeline history={mockHistory} className="custom-timeline" />
      )
      expect(container.querySelector('.custom-timeline')).toBeInTheDocument()
    })

    it('respects maxHeight prop', () => {
      const { container } = render(
        <ComplianceHistoryTimeline history={mockHistory} maxHeight="200px" />
      )
      const scrollArea = container.querySelector('[style*="max-height: 200px"]')
      expect(scrollArea).toBeInTheDocument()
    })

    it('has timeline line element', () => {
      const { container } = render(<ComplianceHistoryTimeline history={mockHistory} />)
      // Timeline line has w-0.5 class
      const line = container.querySelector('.w-0\\.5')
      expect(line).toBeInTheDocument()
    })

    it('has timeline dots for each entry', () => {
      const { container } = render(<ComplianceHistoryTimeline history={mockHistory} />)
      // Each entry has a rounded-full dot
      const dots = container.querySelectorAll('.rounded-full')
      expect(dots.length).toBeGreaterThanOrEqual(mockHistory.length)
    })
  })

  describe('action colors', () => {
    it('applies green color for created action', () => {
      render(<ComplianceHistoryTimeline history={[mockHistory[0]]} />)
      expect(screen.getByText('Created')).toHaveClass('text-green-600')
    })

    it('applies blue color for updated action', () => {
      render(<ComplianceHistoryTimeline history={[mockHistory[1]]} />)
      expect(screen.getByText('Updated')).toHaveClass('text-blue-600')
    })

    it('applies purple color for verified action', () => {
      render(<ComplianceHistoryTimeline history={[mockHistory[2]]} />)
      const verifiedLabel = screen.getAllByText('Verified')[0]
      expect(verifiedLabel).toHaveClass('text-purple-600')
    })
  })

  describe('deleted action', () => {
    it('applies red color for deleted action', () => {
      const deletedHistory: ComplianceMappingHistory[] = [
        {
          ...mockHistory[0],
          action: 'deleted',
        },
      ]
      render(<ComplianceHistoryTimeline history={deletedHistory} />)
      expect(screen.getByText('Deleted')).toHaveClass('text-red-600')
    })
  })

  describe('timestamps', () => {
    it('displays formatted timestamp', () => {
      render(<ComplianceHistoryTimeline history={mockHistory} />)
      // Should display the full date-time
      const timestamps = document.querySelectorAll('[class*="text-xs"]')
      expect(timestamps.length).toBeGreaterThan(0)
    })

    it('displays relative time', () => {
      render(<ComplianceHistoryTimeline history={mockHistory} />)
      // Should show relative time like "5 hours ago"
      expect(screen.getByText(/hours ago|less than an hour ago/i)).toBeInTheDocument()
    })
  })
})

describe('ComplianceHistoryCompact', () => {
  const mockHistory: ComplianceMappingHistory[] = [
    {
      history_id: 'hist-001',
      mapping_id: 'map-001',
      action: 'created',
      previous_status: null,
      new_status: 'not_started',
      change_reason: null,
      changed_by: 'user-001',
      changed_by_name: 'John Doe',
      changed_by_email: 'john@test.com',
      ip_address: null,
      created_at: '2025-01-29T10:00:00Z',
    },
    {
      history_id: 'hist-002',
      mapping_id: 'map-001',
      action: 'updated',
      previous_status: 'not_started',
      new_status: 'in_progress',
      change_reason: null,
      changed_by: 'user-002',
      changed_by_name: 'Jane Smith',
      changed_by_email: null,
      ip_address: null,
      created_at: '2025-01-29T12:00:00Z',
    },
    {
      history_id: 'hist-003',
      mapping_id: 'map-001',
      action: 'verified',
      previous_status: 'in_progress',
      new_status: 'verified',
      change_reason: null,
      changed_by: 'user-001',
      changed_by_name: 'John Doe',
      changed_by_email: null,
      ip_address: null,
      created_at: '2025-01-29T14:00:00Z',
    },
  ]

  describe('empty state', () => {
    it('shows empty message when no history', () => {
      render(<ComplianceHistoryCompact history={[]} />)
      expect(screen.getByText('No history available')).toBeInTheDocument()
    })
  })

  describe('limit', () => {
    it('shows default limit of 5 entries', () => {
      const longHistory = Array.from({ length: 10 }, (_, i) => ({
        ...mockHistory[0],
        history_id: `hist-${i}`,
      }))
      render(<ComplianceHistoryCompact history={longHistory} />)
      // Should show entries and +5 more
      expect(screen.getByText('+5 more entries')).toBeInTheDocument()
    })

    it('respects custom limit', () => {
      render(<ComplianceHistoryCompact history={mockHistory} limit={2} />)
      expect(screen.getByText('+1 more entries')).toBeInTheDocument()
    })

    it('does not show overflow when within limit', () => {
      render(<ComplianceHistoryCompact history={mockHistory.slice(0, 2)} limit={5} />)
      expect(screen.queryByText(/more entries/)).not.toBeInTheDocument()
    })
  })

  describe('rendering entries', () => {
    it('displays action labels', () => {
      render(<ComplianceHistoryCompact history={mockHistory} />)
      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.getByText('Verified')).toBeInTheDocument()
    })

    it('displays user names', () => {
      render(<ComplianceHistoryCompact history={mockHistory} />)
      // John Doe appears twice
      const johnEntries = screen.getAllByText('John Doe')
      expect(johnEntries.length).toBe(2)
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('shows "Unknown" for missing user name', () => {
      const historyWithUnknown = [{
        ...mockHistory[0],
        changed_by_name: null,
      }]
      render(<ComplianceHistoryCompact history={historyWithUnknown} />)
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('action colors', () => {
    it('applies correct color for created action', () => {
      render(<ComplianceHistoryCompact history={[mockHistory[0]]} />)
      expect(screen.getByText('Created')).toHaveClass('text-green-600')
    })

    it('applies correct color for updated action', () => {
      render(<ComplianceHistoryCompact history={[mockHistory[1]]} />)
      expect(screen.getByText('Updated')).toHaveClass('text-blue-600')
    })

    it('applies correct color for verified action', () => {
      render(<ComplianceHistoryCompact history={[mockHistory[2]]} />)
      expect(screen.getByText('Verified')).toHaveClass('text-purple-600')
    })
  })
})
