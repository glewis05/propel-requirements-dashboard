import { describe, it, expect } from 'vitest'
import {
  STATUS_CONFIG,
  getAllowedTransitions,
  canTransition,
  getStatusConfig,
} from '@/lib/status-transitions'
import type { StoryStatus, UserRole } from '@/types/database'

describe('STATUS_CONFIG', () => {
  const allStatuses: StoryStatus[] = [
    'Draft',
    'Internal Review',
    'Pending Client Review',
    'Approved',
    'In Development',
    'In UAT',
    'Needs Discussion',
    'Out of Scope',
  ]

  describe('configuration completeness', () => {
    it.each(allStatuses)('has configuration for %s status', (status) => {
      expect(STATUS_CONFIG[status]).toBeDefined()
      expect(STATUS_CONFIG[status].label).toBeDefined()
      expect(STATUS_CONFIG[status].color).toBeDefined()
      expect(STATUS_CONFIG[status].allowedTransitions).toBeDefined()
      expect(STATUS_CONFIG[status].allowedRoles).toBeDefined()
    })
  })

  describe('Draft status', () => {
    it('can transition to Internal Review, Needs Discussion, Out of Scope', () => {
      const transitions = STATUS_CONFIG['Draft'].allowedTransitions.map((t) => t.to)
      expect(transitions).toContain('Internal Review')
      expect(transitions).toContain('Needs Discussion')
      expect(transitions).toContain('Out of Scope')
    })

    it('is accessible by Admin, Portfolio Manager, Program Manager', () => {
      expect(STATUS_CONFIG['Draft'].allowedRoles).toContain('Admin')
      expect(STATUS_CONFIG['Draft'].allowedRoles).toContain('Portfolio Manager')
      expect(STATUS_CONFIG['Draft'].allowedRoles).toContain('Program Manager')
    })
  })

  describe('Internal Review status', () => {
    it('can transition to Pending Client Review, Draft, Needs Discussion', () => {
      const transitions = STATUS_CONFIG['Internal Review'].allowedTransitions.map((t) => t.to)
      expect(transitions).toContain('Pending Client Review')
      expect(transitions).toContain('Draft')
      expect(transitions).toContain('Needs Discussion')
    })

    it('requires approval for transition to Pending Client Review', () => {
      const toClientReview = STATUS_CONFIG['Internal Review'].allowedTransitions.find(
        (t) => t.to === 'Pending Client Review'
      )
      expect(toClientReview?.requiresApproval).toBe(true)
      expect(toClientReview?.approvalType).toBe('internal_review')
    })
  })

  describe('Pending Client Review status', () => {
    it('can transition to Approved, Needs Discussion, Internal Review', () => {
      const transitions = STATUS_CONFIG['Pending Client Review'].allowedTransitions.map((t) => t.to)
      expect(transitions).toContain('Approved')
      expect(transitions).toContain('Needs Discussion')
      expect(transitions).toContain('Internal Review')
    })

    it('requires stakeholder approval for transition to Approved', () => {
      const toApproved = STATUS_CONFIG['Pending Client Review'].allowedTransitions.find(
        (t) => t.to === 'Approved'
      )
      expect(toApproved?.requiresApproval).toBe(true)
      expect(toApproved?.approvalType).toBe('stakeholder')
    })
  })

  describe('Approved status', () => {
    it('can transition to In Development, Needs Discussion', () => {
      const transitions = STATUS_CONFIG['Approved'].allowedTransitions.map((t) => t.to)
      expect(transitions).toContain('In Development')
      expect(transitions).toContain('Needs Discussion')
    })
  })

  describe('In Development status', () => {
    it('includes Developer in allowed roles', () => {
      expect(STATUS_CONFIG['In Development'].allowedRoles).toContain('Developer')
    })

    it('can transition to In UAT, Needs Discussion', () => {
      const transitions = STATUS_CONFIG['In Development'].allowedTransitions.map((t) => t.to)
      expect(transitions).toContain('In UAT')
      expect(transitions).toContain('Needs Discussion')
    })
  })

  describe('In UAT status', () => {
    it('includes UAT Manager in allowed roles', () => {
      expect(STATUS_CONFIG['In UAT'].allowedRoles).toContain('UAT Manager')
    })

    it('can transition to Approved, In Development, Needs Discussion', () => {
      const transitions = STATUS_CONFIG['In UAT'].allowedTransitions.map((t) => t.to)
      expect(transitions).toContain('Approved')
      expect(transitions).toContain('In Development')
      expect(transitions).toContain('Needs Discussion')
    })
  })

  describe('Out of Scope status', () => {
    it('can only be reopened by Admin or Portfolio Manager', () => {
      expect(STATUS_CONFIG['Out of Scope'].allowedRoles).toContain('Admin')
      expect(STATUS_CONFIG['Out of Scope'].allowedRoles).toContain('Portfolio Manager')
      expect(STATUS_CONFIG['Out of Scope'].allowedRoles).not.toContain('Developer')
    })

    it('can only transition to Draft', () => {
      const transitions = STATUS_CONFIG['Out of Scope'].allowedTransitions.map((t) => t.to)
      expect(transitions).toEqual(['Draft'])
    })

    it('requires notes to reopen', () => {
      const toDraft = STATUS_CONFIG['Out of Scope'].allowedTransitions.find(
        (t) => t.to === 'Draft'
      )
      expect(toDraft?.requiresNotes).toBe(true)
    })
  })
})

describe('getAllowedTransitions', () => {
  it('returns transitions for valid status and role', () => {
    const transitions = getAllowedTransitions('Draft', 'Program Manager')
    expect(transitions.length).toBeGreaterThan(0)
  })

  it('returns empty array when role is null', () => {
    const transitions = getAllowedTransitions('Draft', null)
    expect(transitions).toEqual([])
  })

  it('returns empty array when role is not allowed', () => {
    const transitions = getAllowedTransitions('Draft', 'UAT Tester')
    expect(transitions).toEqual([])
  })

  it('returns correct transitions for Admin on Draft', () => {
    const transitions = getAllowedTransitions('Draft', 'Admin')
    const targetStatuses = transitions.map((t) => t.to)
    expect(targetStatuses).toContain('Internal Review')
    expect(targetStatuses).toContain('Needs Discussion')
    expect(targetStatuses).toContain('Out of Scope')
  })

  it('returns transitions for Developer on In Development', () => {
    const transitions = getAllowedTransitions('In Development', 'Developer')
    const targetStatuses = transitions.map((t) => t.to)
    expect(targetStatuses).toContain('In UAT')
  })

  it('returns empty for Developer on Draft', () => {
    const transitions = getAllowedTransitions('Draft', 'Developer')
    expect(transitions).toEqual([])
  })
})

describe('canTransition', () => {
  it('returns true for valid transition', () => {
    expect(canTransition('Draft', 'Internal Review', 'Program Manager')).toBe(true)
  })

  it('returns false for invalid transition', () => {
    expect(canTransition('Draft', 'Approved', 'Program Manager')).toBe(false)
  })

  it('returns false when role is null', () => {
    expect(canTransition('Draft', 'Internal Review', null)).toBe(false)
  })

  it('returns false when role is not allowed', () => {
    expect(canTransition('Draft', 'Internal Review', 'UAT Tester')).toBe(false)
  })

  it('allows Developer to transition In Development to In UAT', () => {
    expect(canTransition('In Development', 'In UAT', 'Developer')).toBe(true)
  })

  it('prevents Developer from transitioning Draft', () => {
    expect(canTransition('Draft', 'Internal Review', 'Developer')).toBe(false)
  })

  it('allows Portfolio Manager to reopen Out of Scope', () => {
    expect(canTransition('Out of Scope', 'Draft', 'Portfolio Manager')).toBe(true)
  })

  it('prevents Program Manager from reopening Out of Scope', () => {
    expect(canTransition('Out of Scope', 'Draft', 'Program Manager')).toBe(false)
  })
})

describe('getStatusConfig', () => {
  it('returns config for known status', () => {
    const config = getStatusConfig('Draft')
    expect(config.label).toBe('Draft')
    expect(config.color).toBeDefined()
  })

  it('returns config for Approved status', () => {
    const config = getStatusConfig('Approved')
    expect(config.label).toBe('Approved')
    expect(config.color).toContain('bg-success')
  })

  it('returns fallback for unknown status', () => {
    const config = getStatusConfig('Unknown Status' as StoryStatus)
    expect(config.label).toBe('Unknown Status')
    expect(config.color).toContain('bg-muted')
    expect(config.allowedTransitions).toEqual([])
    expect(config.allowedRoles).toEqual([])
  })
})

describe('transition requirements', () => {
  it('flags transitions that require notes', () => {
    const needsDiscussion = STATUS_CONFIG['Draft'].allowedTransitions.find(
      (t) => t.to === 'Needs Discussion'
    )
    expect(needsDiscussion?.requiresNotes).toBe(true)
  })

  it('marks Out of Scope transition as requiring notes', () => {
    const outOfScope = STATUS_CONFIG['Draft'].allowedTransitions.find(
      (t) => t.to === 'Out of Scope'
    )
    expect(outOfScope?.requiresNotes).toBe(true)
  })

  it('does not require notes for simple transitions', () => {
    const toReview = STATUS_CONFIG['Draft'].allowedTransitions.find(
      (t) => t.to === 'Internal Review'
    )
    expect(toReview?.requiresNotes).toBe(false)
  })
})

describe('workflow integrity', () => {
  it('Needs Discussion can return to any working state', () => {
    const transitions = STATUS_CONFIG['Needs Discussion'].allowedTransitions.map((t) => t.to)
    expect(transitions).toContain('Draft')
    expect(transitions).toContain('Internal Review')
    expect(transitions).toContain('Pending Client Review')
    expect(transitions).toContain('Out of Scope')
  })

  it('all statuses have at least one transition except terminal states', () => {
    // Out of Scope is the only terminal-ish state but even it can go back to Draft
    Object.values(STATUS_CONFIG).forEach((config) => {
      expect(config.allowedTransitions.length).toBeGreaterThanOrEqual(1)
    })
  })
})
