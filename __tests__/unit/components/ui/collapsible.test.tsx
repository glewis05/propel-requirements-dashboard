import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

describe('Collapsible', () => {
  describe('initial state', () => {
    it('renders closed by default', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })

    it('renders open when open prop is true', () => {
      render(
        <Collapsible open={true}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('toggling', () => {
    it('opens when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )

      expect(screen.queryByText('Content')).not.toBeInTheDocument()
      await user.click(screen.getByText('Toggle'))
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('closes when trigger is clicked again', async () => {
      const user = userEvent.setup()
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )

      await user.click(screen.getByText('Toggle'))
      expect(screen.getByText('Content')).toBeInTheDocument()

      await user.click(screen.getByText('Toggle'))
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })
  })

  describe('controlled mode', () => {
    it('calls onOpenChange when toggled', async () => {
      const user = userEvent.setup()
      const handleOpenChange = vi.fn()

      render(
        <Collapsible open={false} onOpenChange={handleOpenChange}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )

      await user.click(screen.getByText('Toggle'))
      expect(handleOpenChange).toHaveBeenCalledWith(true)
    })

    it('respects controlled open state', () => {
      const { rerender } = render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )

      expect(screen.queryByText('Content')).not.toBeInTheDocument()

      rerender(
        <Collapsible open={true}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })
})

describe('CollapsibleTrigger', () => {
  it('renders as a button by default', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>
    )
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument()
  })

  it('has type="button" to prevent form submission', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>
    )
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('calls custom onClick handler', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <Collapsible>
        <CollapsibleTrigger onClick={handleClick}>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    await user.click(screen.getByText('Toggle'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('supports asChild prop to render as child element', async () => {
    const user = userEvent.setup()
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div data-testid="custom-trigger">Custom Trigger</div>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    await user.click(screen.getByTestId('custom-trigger'))
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})

describe('CollapsibleContent', () => {
  it('renders null when closed', () => {
    render(
      <Collapsible open={false}>
        <CollapsibleContent data-testid="content">Content</CollapsibleContent>
      </Collapsible>
    )
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
  })

  it('renders children when open', () => {
    render(
      <Collapsible open={true}>
        <CollapsibleContent>Visible Content</CollapsibleContent>
      </Collapsible>
    )
    expect(screen.getByText('Visible Content')).toBeInTheDocument()
  })

  it('passes props to content div', () => {
    render(
      <Collapsible open={true}>
        <CollapsibleContent data-testid="content" className="custom">
          Content
        </CollapsibleContent>
      </Collapsible>
    )
    const content = screen.getByTestId('content')
    expect(content).toHaveClass('custom')
  })
})

describe('Accessibility', () => {
  it('trigger is keyboard accessible', async () => {
    const user = userEvent.setup()
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    const trigger = screen.getByRole('button')
    trigger.focus()
    expect(trigger).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('trigger responds to Space key', async () => {
    const user = userEvent.setup()
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )

    const trigger = screen.getByRole('button')
    trigger.focus()
    await user.keyboard(' ')
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
