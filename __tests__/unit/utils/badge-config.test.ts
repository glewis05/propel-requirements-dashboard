import { describe, it, expect } from 'vitest'
import {
  statusBadgeConfig,
  priorityBadgeConfig,
  getStatusBadge,
  getPriorityBadge,
} from '@/lib/badge-config'

describe('statusBadgeConfig', () => {
  describe('configuration', () => {
    it('has configuration for Draft status', () => {
      expect(statusBadgeConfig['Draft']).toBeDefined()
      expect(statusBadgeConfig['Draft'].className).toBeDefined()
      expect(statusBadgeConfig['Draft'].icon).toBeDefined()
    })

    it('has configuration for Internal Review status', () => {
      expect(statusBadgeConfig['Internal Review']).toBeDefined()
    })

    it('has configuration for Pending Client Review status', () => {
      expect(statusBadgeConfig['Pending Client Review']).toBeDefined()
    })

    it('has configuration for Approved status', () => {
      expect(statusBadgeConfig['Approved']).toBeDefined()
    })

    it('has configuration for Needs Discussion status', () => {
      expect(statusBadgeConfig['Needs Discussion']).toBeDefined()
    })

    it('has configuration for Out of Scope status', () => {
      expect(statusBadgeConfig['Out of Scope']).toBeDefined()
    })

    it('has configuration for In Development status', () => {
      expect(statusBadgeConfig['In Development']).toBeDefined()
    })

    it('has configuration for In UAT status', () => {
      expect(statusBadgeConfig['In UAT']).toBeDefined()
    })
  })

  describe('status colors', () => {
    it('Draft has muted styling', () => {
      expect(statusBadgeConfig['Draft'].className).toContain('bg-muted')
    })

    it('Approved has success styling', () => {
      expect(statusBadgeConfig['Approved'].className).toContain('bg-success')
    })

    it('Needs Discussion has destructive styling', () => {
      expect(statusBadgeConfig['Needs Discussion'].className).toContain('bg-destructive')
    })

    it('Pending Client Review has warning styling', () => {
      expect(statusBadgeConfig['Pending Client Review'].className).toContain('bg-warning')
    })
  })
})

describe('priorityBadgeConfig', () => {
  describe('configuration', () => {
    it('has configuration for Must Have priority', () => {
      expect(priorityBadgeConfig['Must Have']).toBeDefined()
      expect(priorityBadgeConfig['Must Have'].className).toBeDefined()
      expect(priorityBadgeConfig['Must Have'].icon).toBeDefined()
    })

    it('has configuration for Should Have priority', () => {
      expect(priorityBadgeConfig['Should Have']).toBeDefined()
    })

    it('has configuration for Could Have priority', () => {
      expect(priorityBadgeConfig['Could Have']).toBeDefined()
    })

    it("has configuration for Won't Have priority", () => {
      expect(priorityBadgeConfig["Won't Have"]).toBeDefined()
    })
  })

  describe('priority colors', () => {
    it('Must Have has destructive styling (highest priority)', () => {
      expect(priorityBadgeConfig['Must Have'].className).toContain('bg-destructive')
    })

    it('Should Have has warning styling', () => {
      expect(priorityBadgeConfig['Should Have'].className).toContain('bg-warning')
    })

    it('Could Have has primary styling', () => {
      expect(priorityBadgeConfig['Could Have'].className).toContain('bg-primary')
    })

    it("Won't Have has muted styling (lowest priority)", () => {
      expect(priorityBadgeConfig["Won't Have"].className).toContain('bg-muted')
    })
  })
})

describe('getStatusBadge', () => {
  it('returns config for known status', () => {
    const badge = getStatusBadge('Draft')
    expect(badge.className).toBe(statusBadgeConfig['Draft'].className)
    expect(badge.icon).toBe(statusBadgeConfig['Draft'].icon)
  })

  it('returns config for Approved status', () => {
    const badge = getStatusBadge('Approved')
    expect(badge.className).toContain('bg-success')
  })

  it('returns fallback for unknown status', () => {
    const badge = getStatusBadge('Unknown Status')
    expect(badge.className).toContain('bg-muted')
    expect(badge.icon).toBeDefined()
  })

  it('returns fallback for empty string', () => {
    const badge = getStatusBadge('')
    expect(badge).toBeDefined()
    expect(badge.className).toContain('bg-muted')
  })
})

describe('getPriorityBadge', () => {
  it('returns config for known priority', () => {
    const badge = getPriorityBadge('Must Have')
    expect(badge.className).toBe(priorityBadgeConfig['Must Have'].className)
    expect(badge.icon).toBe(priorityBadgeConfig['Must Have'].icon)
  })

  it('returns config for Should Have priority', () => {
    const badge = getPriorityBadge('Should Have')
    expect(badge.className).toContain('bg-warning')
  })

  it('returns fallback for unknown priority', () => {
    const badge = getPriorityBadge('Unknown Priority')
    expect(badge.className).toContain('bg-muted')
    expect(badge.icon).toBeDefined()
  })

  it('returns fallback for empty string', () => {
    const badge = getPriorityBadge('')
    expect(badge).toBeDefined()
    expect(badge.className).toContain('bg-muted')
  })
})

describe('icon types', () => {
  it('status icons are React components or forwardRef objects', () => {
    Object.values(statusBadgeConfig).forEach((config) => {
      // Lucide icons are either functions or forwardRef objects
      expect(['function', 'object'].includes(typeof config.icon)).toBe(true)
    })
  })

  it('priority icons are React components or forwardRef objects', () => {
    Object.values(priorityBadgeConfig).forEach((config) => {
      // Lucide icons are either functions or forwardRef objects
      expect(['function', 'object'].includes(typeof config.icon)).toBe(true)
    })
  })
})
