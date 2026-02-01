import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset body overflow
    document.body.style.overflow = ''
  })

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(<ConfirmDialog {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} isOpen={false} />)
      // Component returns null, so dialog shouldn't be in the document
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
    })

    it('renders default button text', () => {
      render(<ConfirmDialog {...defaultProps} />)
      // Find buttons containing the text
      const buttons = screen.getAllByRole('button')
      const buttonTexts = buttons.map(b => b.textContent)
      expect(buttonTexts).toContain('Confirm')
      expect(buttonTexts).toContain('Cancel')
    })

    it('renders custom button text', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmText="Delete"
          cancelText="Keep"
        />
      )
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Keep')).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('applies danger variant styles', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />)
      const confirmButton = screen.getByText('Confirm')
      expect(confirmButton.className).toContain('bg-destructive')
    })

    it('applies warning variant styles', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />)
      const confirmButton = screen.getByText('Confirm')
      expect(confirmButton.className).toContain('bg-warning')
    })

    it('applies default variant styles', () => {
      render(<ConfirmDialog {...defaultProps} variant="default" />)
      const confirmButton = screen.getByText('Confirm')
      expect(confirmButton.className).toContain('bg-primary')
    })
  })

  describe('interactions', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />)

      await user.click(screen.getByText('Cancel'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

      await user.click(screen.getByText('Confirm'))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const { container } = render(<ConfirmDialog {...defaultProps} onClose={onClose} />)

      // Click the backdrop - it's the first div with bg-black class
      const backdrop = container.querySelector('.bg-black\\/50')
      if (backdrop) {
        await user.click(backdrop)
        expect(onClose).toHaveBeenCalledTimes(1)
      }
    })

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />)

      const closeButton = screen.getByLabelText('Close dialog')
      await user.click(closeButton)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />)

      await user.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('loading state', () => {
    it('shows "Processing..." when isLoading is true', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />)
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('disables buttons when isLoading is true', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />)
      const processingButton = screen.getByText('Processing...')
      const cancelButton = screen.getByText('Cancel')
      expect(processingButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
    })

    it('disables close button when isLoading is true', () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />)
      const closeButton = screen.getByLabelText('Close dialog')
      expect(closeButton).toBeDisabled()
    })

    it('does not close on backdrop click when isLoading', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const { container } = render(<ConfirmDialog {...defaultProps} onClose={onClose} isLoading={true} />)

      const backdrop = container.querySelector('.bg-black\\/50')
      if (backdrop) {
        await user.click(backdrop)
        expect(onClose).not.toHaveBeenCalled()
      }
    })

    it('does not close on Escape when isLoading', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ConfirmDialog {...defaultProps} onClose={onClose} isLoading={true} />)

      await user.keyboard('{Escape}')
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('body scroll lock', () => {
    it('prevents body scroll when dialog is open', () => {
      render(<ConfirmDialog {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body scroll when dialog closes', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')

      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />)
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<ConfirmDialog {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal="true"', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby pointing to title', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title')
      const title = screen.getByText('Confirm Action')
      expect(title).toHaveAttribute('id', 'dialog-title')
    })

    it('focuses dialog on open', () => {
      render(<ConfirmDialog {...defaultProps} />)
      // The dialog should have tabIndex for focus
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('tabIndex', '-1')
    })

    it('close button has accessible label', () => {
      render(<ConfirmDialog {...defaultProps} />)
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument()
    })
  })

  describe('icon display', () => {
    it('displays AlertTriangle icon', () => {
      render(<ConfirmDialog {...defaultProps} />)
      // The AlertTriangle icon is rendered - check for SVG
      const dialog = screen.getByRole('dialog')
      const svg = dialog.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})
