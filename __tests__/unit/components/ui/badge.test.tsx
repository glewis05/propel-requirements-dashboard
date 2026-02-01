import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Badge>Test Badge</Badge>)
      expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('renders with default variant', () => {
      const { container } = render(<Badge>Default</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
    })
  })

  describe('variants', () => {
    it('applies default variant styles', () => {
      const { container } = render(<Badge variant="default">Default</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('applies secondary variant styles', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('applies destructive variant styles', () => {
      const { container } = render(<Badge variant="destructive">Destructive</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('applies outline variant styles', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('text-foreground')
    })

    it('applies success variant styles', () => {
      const { container } = render(<Badge variant="success">Success</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('applies warning variant styles', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
    })
  })

  describe('styling', () => {
    it('has rounded-full class', () => {
      const { container } = render(<Badge>Rounded</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('rounded-full')
    })

    it('has border class', () => {
      const { container } = render(<Badge>Border</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('border')
    })

    it('has font-semibold class', () => {
      const { container } = render(<Badge>Bold</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('font-semibold')
    })

    it('has text-xs class', () => {
      const { container } = render(<Badge>Small</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('text-xs')
    })

    it('applies custom className', () => {
      const { container } = render(<Badge className="custom-class">Custom</Badge>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveClass('custom-class')
    })
  })

  describe('props', () => {
    it('spreads additional props', () => {
      render(<Badge data-testid="test-badge">Props</Badge>)
      expect(screen.getByTestId('test-badge')).toBeInTheDocument()
    })

    it('handles onClick when passed', () => {
      const handleClick = vi.fn()
      render(<Badge onClick={handleClick}>Clickable</Badge>)
      screen.getByText('Clickable').click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})

// Test the badge with different content types
describe('Badge content', () => {
  it('renders number content', () => {
    render(<Badge>{42}</Badge>)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders JSX content', () => {
    render(
      <Badge>
        <span data-testid="inner">Inner</span>
      </Badge>
    )
    expect(screen.getByTestId('inner')).toBeInTheDocument()
  })

  it('renders multiple children', () => {
    render(
      <Badge>
        <span>One</span>
        <span>Two</span>
      </Badge>
    )
    expect(screen.getByText('One')).toBeInTheDocument()
    expect(screen.getByText('Two')).toBeInTheDocument()
  })
})
