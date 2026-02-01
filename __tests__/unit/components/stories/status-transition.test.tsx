import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusTransition } from '@/components/stories/status-transition'
import * as storyActions from '@/app/(dashboard)/stories/actions'
import type { StoryStatus, UserRole } from '@/types/database'

// Mock the story actions
vi.mock('@/app/(dashboard)/stories/actions', () => ({
  transitionStoryStatus: vi.fn(),
}))

describe('StatusTransition', () => {
  const defaultProps = {
    storyId: 'story-001',
    currentStatus: 'Draft' as StoryStatus,
    userRole: 'Program Manager' as UserRole,
    onStatusChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(storyActions.transitionStoryStatus).mockResolvedValue({
      success: true,
    })
  })

  describe('rendering', () => {
    it('renders current status', () => {
      render(<StatusTransition {...defaultProps} />)
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('renders as clickable button when transitions are available', () => {
      render(<StatusTransition {...defaultProps} />)
      // Component renders a button when transitions are available
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('shows chevron icon when transitions are available', () => {
      const { container } = render(<StatusTransition {...defaultProps} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('no transitions available', () => {
    it('renders as plain badge when no role', () => {
      const { container } = render(<StatusTransition {...defaultProps} userRole={null} />)
      // No button should be present when no transitions available
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(0)
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('renders as plain badge for UAT Tester on Draft status', () => {
      const { container } = render(<StatusTransition {...defaultProps} userRole="UAT Tester" />)
      // UAT Tester cannot transition Draft stories - should be span not button
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(0)
    })

    it('renders as plain badge for Out of Scope with Developer role', () => {
      const { container } = render(
        <StatusTransition
          {...defaultProps}
          currentStatus="Out of Scope"
          userRole="Developer"
        />
      )
      // Developer cannot transition Out of Scope stories
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBe(0)
    })
  })

  describe('dropdown menu', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)

      expect(screen.getByText('Change status to:')).toBeInTheDocument()
    })

    it('shows allowed transitions for Draft status', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)

      // Draft can transition to Internal Review, Needs Discussion, Out of Scope
      expect(screen.getByText('Submit for Internal Review')).toBeInTheDocument()
      expect(screen.getByText('Flag for Discussion')).toBeInTheDocument()
      expect(screen.getByText('Mark Out of Scope')).toBeInTheDocument()
    })

    it('shows allowed transitions for Approved status', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} currentStatus="Approved" />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)

      expect(screen.getByText('Start Development')).toBeInTheDocument()
      expect(screen.getByText('Flag for Discussion')).toBeInTheDocument()
    })

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <StatusTransition {...defaultProps} />
        </div>
      )

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      expect(screen.getByText('Change status to:')).toBeInTheDocument()

      await user.click(screen.getByTestId('outside'))

      await waitFor(() => {
        expect(screen.queryByText('Change status to:')).not.toBeInTheDocument()
      })
    })
  })

  describe('transition modal', () => {
    it('opens modal when transition is selected', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('shows current and target status in modal', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))

      // Should show Draft → Internal Review
      const statusBadges = screen.getAllByText('Draft')
      expect(statusBadges.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Internal Review')).toBeInTheDocument()
    })

    it('shows notes field', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))

      expect(screen.getByLabelText(/Notes/)).toBeInTheDocument()
    })

    it('requires notes for transitions that need them', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      // Flag for Discussion requires notes
      await user.click(screen.getByText('Flag for Discussion'))

      expect(screen.getByText('Notes are required for this transition')).toBeInTheDocument()
    })

    it('closes modal on cancel', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))

      await user.click(screen.getByText('Cancel'))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes modal on X button', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))

      await user.click(screen.getByLabelText('Close dialog'))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes modal on Escape key', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('transition execution', () => {
    it('calls transitionStoryStatus on confirm', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))
      await user.click(screen.getByText('Confirm Change'))

      await waitFor(() => {
        expect(storyActions.transitionStoryStatus).toHaveBeenCalledWith(
          'story-001',
          'Internal Review',
          undefined
        )
      })
    })

    it('passes notes when provided', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))

      await user.type(screen.getByLabelText(/Notes/), 'Ready for review')
      await user.click(screen.getByText('Confirm Change'))

      await waitFor(() => {
        expect(storyActions.transitionStoryStatus).toHaveBeenCalledWith(
          'story-001',
          'Internal Review',
          'Ready for review'
        )
      })
    })

    it('validates required notes before submit', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Flag for Discussion'))

      // Try to submit without notes
      await user.click(screen.getByText('Confirm Change'))

      expect(screen.getByText('Notes are required for this status change')).toBeInTheDocument()
      expect(storyActions.transitionStoryStatus).not.toHaveBeenCalled()
    })

    it('calls onStatusChange on successful transition', async () => {
      const user = userEvent.setup()
      const onStatusChange = vi.fn()
      render(<StatusTransition {...defaultProps} onStatusChange={onStatusChange} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))
      await user.click(screen.getByText('Confirm Change'))

      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith('Internal Review')
      })
    })

    it('shows error message on failed transition', async () => {
      vi.mocked(storyActions.transitionStoryStatus).mockResolvedValue({
        success: false,
        error: 'Permission denied',
      })

      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))
      await user.click(screen.getByText('Confirm Change'))

      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument()
      })
    })

    it('shows loading state during transition', async () => {
      // Make the action hang
      vi.mocked(storyActions.transitionStoryStatus).mockImplementation(
        () => new Promise(() => {})
      )

      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))
      await user.click(screen.getByText('Confirm Change'))

      expect(screen.getByText('Updating...')).toBeInTheDocument()
    })

    it('disables buttons during loading', async () => {
      vi.mocked(storyActions.transitionStoryStatus).mockImplementation(
        () => new Promise(() => {})
      )

      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      await user.click(screen.getByText('Submit for Internal Review'))
      await user.click(screen.getByText('Confirm Change'))

      // The updating button should be disabled
      const updatingButton = screen.getByText('Updating...')
      expect(updatingButton).toBeDisabled()
    })
  })

  describe('approval indicator', () => {
    it('shows approval indicator for transitions requiring approval', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} currentStatus="Internal Review" />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)
      // This transition requires approval
      await user.click(screen.getByText('Approve & Send to Client'))

      expect(screen.getByText(/record an approval/)).toBeInTheDocument()
    })
  })

  describe('role-based access', () => {
    it('Developer can transition In Development status', async () => {
      const user = userEvent.setup()
      render(
        <StatusTransition
          {...defaultProps}
          currentStatus="In Development"
          userRole="Developer"
        />
      )

      const button = screen.getAllByRole('button')[0]
      await user.click(button)

      expect(screen.getByText('Move to UAT')).toBeInTheDocument()
    })

    it('Admin can access all transitions', async () => {
      const user = userEvent.setup()
      render(<StatusTransition {...defaultProps} userRole="Admin" />)

      const button = screen.getAllByRole('button')[0]
      await user.click(button)

      expect(screen.getByText('Submit for Internal Review')).toBeInTheDocument()
    })
  })
})
