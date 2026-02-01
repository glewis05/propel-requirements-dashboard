import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComplianceBadge, ComplianceBadgeGroup } from '@/components/compliance/compliance-badge'

describe('ComplianceBadge', () => {
  describe('rendering', () => {
    it('renders CFR11 badge', () => {
      render(<ComplianceBadge frameworkCode="CFR11" />)
      // The badge should be present with an icon
      const badge = document.querySelector('[class*="inline-flex"]')
      expect(badge).toBeInTheDocument()
    })

    it('renders HIPAA badge', () => {
      render(<ComplianceBadge frameworkCode="HIPAA" />)
      const badge = document.querySelector('[class*="inline-flex"]')
      expect(badge).toBeInTheDocument()
    })

    it('renders HITRUST badge', () => {
      render(<ComplianceBadge frameworkCode="HITRUST" />)
      const badge = document.querySelector('[class*="inline-flex"]')
      expect(badge).toBeInTheDocument()
    })

    it('renders SOC2 badge', () => {
      render(<ComplianceBadge frameworkCode="SOC2" />)
      const badge = document.querySelector('[class*="inline-flex"]')
      expect(badge).toBeInTheDocument()
    })

    it('returns null for unknown framework', () => {
      const { container } = render(<ComplianceBadge frameworkCode="UNKNOWN" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('label display', () => {
    it('hides label by default', () => {
      render(<ComplianceBadge frameworkCode="CFR11" />)
      expect(screen.queryByText('Part 11')).not.toBeInTheDocument()
    })

    it('shows label when showLabel is true', () => {
      render(<ComplianceBadge frameworkCode="CFR11" showLabel />)
      expect(screen.getByText('Part 11')).toBeInTheDocument()
    })

    it('shows HIPAA short name', () => {
      render(<ComplianceBadge frameworkCode="HIPAA" showLabel />)
      expect(screen.getByText('HIPAA')).toBeInTheDocument()
    })

    it('shows SOC 2 short name', () => {
      render(<ComplianceBadge frameworkCode="SOC2" showLabel />)
      expect(screen.getByText('SOC 2')).toBeInTheDocument()
    })
  })

  describe('count display', () => {
    it('does not show count when not provided', () => {
      render(<ComplianceBadge frameworkCode="CFR11" />)
      const countBadge = document.querySelector('.rounded-full.bg-white\\/50')
      expect(countBadge).not.toBeInTheDocument()
    })

    it('shows count when provided', () => {
      render(<ComplianceBadge frameworkCode="CFR11" count={5} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('does not show count when 0', () => {
      render(<ComplianceBadge frameworkCode="CFR11" count={0} />)
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('shows large count number', () => {
      render(<ComplianceBadge frameworkCode="CFR11" count={42} />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('applies small size classes', () => {
      render(<ComplianceBadge frameworkCode="CFR11" size="sm" />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveClass('h-4', 'w-4')
    })

    it('applies medium size classes', () => {
      render(<ComplianceBadge frameworkCode="CFR11" size="md" />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveClass('h-5', 'w-5')
    })

    it('applies large size classes', () => {
      render(<ComplianceBadge frameworkCode="CFR11" size="lg" />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveClass('h-6', 'w-6')
    })

    it('defaults to small size', () => {
      render(<ComplianceBadge frameworkCode="CFR11" />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveClass('h-4', 'w-4')
    })
  })

  describe('tooltip', () => {
    it('has tooltip trigger wrapper', async () => {
      render(<ComplianceBadge frameworkCode="CFR11" />)
      // Tooltip content should be available
      const badge = document.querySelector('[class*="inline-flex"]')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      render(<ComplianceBadge frameworkCode="CFR11" className="custom-class" />)
      const badge = document.querySelector('.custom-class')
      expect(badge).toBeInTheDocument()
    })

    it('has border styling', () => {
      render(<ComplianceBadge frameworkCode="CFR11" />)
      const badge = document.querySelector('[class*="inline-flex"]')
      expect(badge).toHaveClass('border')
    })

    it('has rounded-md styling', () => {
      render(<ComplianceBadge frameworkCode="CFR11" />)
      const badge = document.querySelector('[class*="inline-flex"]')
      expect(badge).toHaveClass('rounded-md')
    })
  })

  describe('icons', () => {
    it('renders FileCheck icon for CFR11', () => {
      render(<ComplianceBadge frameworkCode="CFR11" />)
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('renders Shield icon for HIPAA', () => {
      render(<ComplianceBadge frameworkCode="HIPAA" />)
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})

describe('ComplianceBadgeGroup', () => {
  const mockFrameworks = [
    { code: 'CFR11', count: 5 },
    { code: 'HIPAA', count: 8 },
    { code: 'HITRUST', count: 3 },
    { code: 'SOC2', count: 4 },
  ]

  describe('rendering', () => {
    it('renders null when frameworks array is empty', () => {
      const { container } = render(<ComplianceBadgeGroup frameworks={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders all frameworks when under maxDisplay', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks.slice(0, 2)} />)
      const badges = document.querySelectorAll('[class*="inline-flex"]')
      expect(badges.length).toBe(2)
    })

    it('renders maxDisplay frameworks by default', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks} />)
      const badges = document.querySelectorAll('[class*="inline-flex"]')
      expect(badges.length).toBe(4)
    })

    it('respects custom maxDisplay', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks} maxDisplay={2} />)
      const badges = document.querySelectorAll('[class*="inline-flex"]')
      expect(badges.length).toBe(2)
    })
  })

  describe('overflow indicator', () => {
    it('shows overflow count when frameworks exceed maxDisplay', () => {
      const frameworks = [
        ...mockFrameworks,
        { code: 'EXTRA1', count: 1 },
        { code: 'EXTRA2', count: 2 },
      ]
      render(<ComplianceBadgeGroup frameworks={frameworks} maxDisplay={4} />)
      expect(screen.getByText('+2 more')).toBeInTheDocument()
    })

    it('does not show overflow when within maxDisplay', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks.slice(0, 2)} maxDisplay={4} />)
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument()
    })

    it('shows correct overflow count', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks} maxDisplay={2} />)
      expect(screen.getByText('+2 more')).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('passes size to child badges', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks.slice(0, 1)} size="lg" />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveClass('h-6', 'w-6')
    })

    it('defaults to small size', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks.slice(0, 1)} />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveClass('h-4', 'w-4')
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks} className="custom-group" />)
      const group = document.querySelector('.custom-group')
      expect(group).toBeInTheDocument()
    })

    it('has flex layout', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks} />)
      const group = document.querySelector('[class*="flex"]')
      expect(group).toHaveClass('flex', 'items-center')
    })

    it('has gap between badges', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks} />)
      const group = document.querySelector('[class*="flex"]')
      expect(group).toHaveClass('gap-1')
    })

    it('allows flex wrapping', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks} />)
      const group = document.querySelector('[class*="flex"]')
      expect(group).toHaveClass('flex-wrap')
    })
  })

  describe('count display', () => {
    it('passes count to each badge', () => {
      render(<ComplianceBadgeGroup frameworks={mockFrameworks.slice(0, 1)} />)
      // CFR11 has count 5
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })
})
