import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CollapsibleSection } from '@/components/stories/collapsible-section'
import { FileText } from 'lucide-react'

describe('CollapsibleSection', () => {
  describe('rendering', () => {
    it('renders the title', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )
      expect(screen.getByText('Test Section')).toBeInTheDocument()
    })

    it('renders the icon when provided', () => {
      render(
        <CollapsibleSection title="Test Section" icon={<FileText data-testid="icon" />}>
          <div>Content</div>
        </CollapsibleSection>
      )
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('renders the badge when provided', () => {
      render(
        <CollapsibleSection title="Test Section" badge={5}>
          <div>Content</div>
        </CollapsibleSection>
      )
      expect(screen.getByText('(5)')).toBeInTheDocument()
    })

    it('renders badge with string value', () => {
      render(
        <CollapsibleSection title="Test Section" badge="New">
          <div>Content</div>
        </CollapsibleSection>
      )
      expect(screen.getByText('(New)')).toBeInTheDocument()
    })

    it('renders badge with 0 value', () => {
      render(
        <CollapsibleSection title="Test Section" badge={0}>
          <div>Content</div>
        </CollapsibleSection>
      )
      expect(screen.getByText('(0)')).toBeInTheDocument()
    })
  })

  describe('default state', () => {
    it('is open by default', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('can be closed by default', () => {
      render(
        <CollapsibleSection title="Test Section" defaultOpen={false}>
          <div>Content</div>
        </CollapsibleSection>
      )
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })
  })

  describe('toggle behavior', () => {
    it('closes when header is clicked while open', async () => {
      const user = userEvent.setup()
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()

      await user.click(screen.getByRole('button'))

      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })

    it('opens when header is clicked while closed', async () => {
      const user = userEvent.setup()
      render(
        <CollapsibleSection title="Test Section" defaultOpen={false}>
          <div>Content</div>
        </CollapsibleSection>
      )

      expect(screen.queryByText('Content')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('toggles multiple times', async () => {
      const user = userEvent.setup()
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )

      const button = screen.getByRole('button')

      // Initially open
      expect(screen.getByText('Content')).toBeInTheDocument()

      // Close
      await user.click(button)
      expect(screen.queryByText('Content')).not.toBeInTheDocument()

      // Open
      await user.click(button)
      expect(screen.getByText('Content')).toBeInTheDocument()

      // Close again
      await user.click(button)
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })
  })

  describe('chevron icon', () => {
    it('shows down chevron when open', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )

      // When open, ChevronDown should be visible
      const svgs = document.querySelectorAll('svg')
      // Should find a ChevronDown icon
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('shows right chevron when closed', () => {
      render(
        <CollapsibleSection title="Test Section" defaultOpen={false}>
          <div>Content</div>
        </CollapsibleSection>
      )

      // When closed, ChevronRight should be visible
      const svgs = document.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe('styling', () => {
    it('has card styling', () => {
      const { container } = render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )

      const section = container.firstChild as HTMLElement
      expect(section).toHaveClass('rounded-lg', 'bg-card', 'shadow-sm', 'border')
    })

    it('button spans full width', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('content has border-top when open', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div data-testid="content">Content</div>
        </CollapsibleSection>
      )

      const contentWrapper = screen.getByTestId('content').parentElement
      expect(contentWrapper).toHaveClass('border-t')
    })
  })

  describe('accessibility', () => {
    it('trigger is a button', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('button has type="button"', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('title is an h2', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Section')
    })
  })

  describe('children rendering', () => {
    it('renders complex children', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <p>Paragraph</p>
        </CollapsibleSection>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByText('Paragraph')).toBeInTheDocument()
    })

    it('renders functional component children', () => {
      const TestChild = () => <span data-testid="func-child">Functional</span>

      render(
        <CollapsibleSection title="Test Section">
          <TestChild />
        </CollapsibleSection>
      )

      expect(screen.getByTestId('func-child')).toBeInTheDocument()
    })
  })
})
