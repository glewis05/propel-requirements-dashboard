/**
 * Validation/UAT Workflow Integration Tests
 *
 * These tests verify the validation and UAT workflows:
 * - Execution status transitions (assigned → in_progress → passed/failed/blocked → verified)
 * - Defect lifecycle (open → confirmed → in_progress → fixed → verified → closed)
 * - Permission helpers for role-based access
 * - Test case status configuration
 */

import { describe, it, expect } from 'vitest'
import {
  EXECUTION_STATUS_CONFIG,
  DEFECT_STATUS_CONFIG,
  TEST_CASE_STATUS_CONFIG,
  getAllowedExecutionTransitions,
  canTransitionExecution,
  getExecutionStatusConfig,
  getAllowedDefectTransitions,
  getDefectStatusConfig,
  canGenerateTestCases,
  canCreateTestCases,
  canAssignTesters,
  canExecuteTests,
  canVerifyResults,
  canCreateDefects,
  canResolveDefects,
} from '@/lib/validation/execution-transitions'
import type { ExecutionStatus, DefectStatus, UserRole } from '@/types/database'

describe('Execution Status Configuration', () => {
  const allExecutionStatuses: ExecutionStatus[] = [
    'assigned',
    'in_progress',
    'passed',
    'failed',
    'blocked',
    'verified',
  ]

  describe('EXECUTION_STATUS_CONFIG', () => {
    it('defines all execution statuses', () => {
      expect(Object.keys(EXECUTION_STATUS_CONFIG)).toHaveLength(6)
    })

    it.each(allExecutionStatuses)('%s status has required properties', (status) => {
      const config = EXECUTION_STATUS_CONFIG[status]
      expect(config).toBeDefined()
      expect(config.label).toBeDefined()
      expect(config.color).toBeDefined()
      expect(config.allowedTransitions).toBeDefined()
      expect(config.allowedRoles).toBeDefined()
      expect(Array.isArray(config.allowedTransitions)).toBe(true)
      expect(Array.isArray(config.allowedRoles)).toBe(true)
    })

    it('assigned status can transition to in_progress', () => {
      const transitions = EXECUTION_STATUS_CONFIG.assigned.allowedTransitions
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('in_progress')
      expect(transitions[0].label).toBe('Start Testing')
    })

    it('in_progress status can transition to passed, failed, or blocked', () => {
      const transitions = EXECUTION_STATUS_CONFIG.in_progress.allowedTransitions
      expect(transitions).toHaveLength(3)
      const targetStatuses = transitions.map((t) => t.to)
      expect(targetStatuses).toContain('passed')
      expect(targetStatuses).toContain('failed')
      expect(targetStatuses).toContain('blocked')
    })

    it('passed status can transition to verified', () => {
      const transitions = EXECUTION_STATUS_CONFIG.passed.allowedTransitions
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('verified')
    })

    it('failed status can transition back to in_progress for re-test', () => {
      const transitions = EXECUTION_STATUS_CONFIG.failed.allowedTransitions
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('in_progress')
      expect(transitions[0].label).toBe('Re-test')
    })

    it('blocked status can transition back to in_progress', () => {
      const transitions = EXECUTION_STATUS_CONFIG.blocked.allowedTransitions
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('in_progress')
    })

    it('verified status is terminal with no transitions', () => {
      const transitions = EXECUTION_STATUS_CONFIG.verified.allowedTransitions
      expect(transitions).toHaveLength(0)
    })

    it('failed transition requires notes', () => {
      const failedTransition = EXECUTION_STATUS_CONFIG.in_progress.allowedTransitions.find(
        (t) => t.to === 'failed'
      )
      expect(failedTransition?.requiresNotes).toBe(true)
    })

    it('blocked transition requires notes', () => {
      const blockedTransition = EXECUTION_STATUS_CONFIG.in_progress.allowedTransitions.find(
        (t) => t.to === 'blocked'
      )
      expect(blockedTransition?.requiresNotes).toBe(true)
    })
  })

  describe('getAllowedExecutionTransitions', () => {
    it('returns transitions for UAT Tester from assigned', () => {
      const transitions = getAllowedExecutionTransitions('assigned', 'UAT Tester')
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('in_progress')
    })

    it('returns transitions for UAT Manager from in_progress', () => {
      const transitions = getAllowedExecutionTransitions('in_progress', 'UAT Manager')
      expect(transitions).toHaveLength(3)
    })

    it('returns empty array for null role', () => {
      const transitions = getAllowedExecutionTransitions('assigned', null)
      expect(transitions).toHaveLength(0)
    })

    it('returns empty array for Developer role (not allowed)', () => {
      const transitions = getAllowedExecutionTransitions('assigned', 'Developer')
      expect(transitions).toHaveLength(0)
    })

    it('Admin can transition from passed to verified', () => {
      const transitions = getAllowedExecutionTransitions('passed', 'Admin')
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('verified')
    })

    it('UAT Tester cannot verify passed tests', () => {
      const transitions = getAllowedExecutionTransitions('passed', 'UAT Tester')
      expect(transitions).toHaveLength(0)
    })
  })

  describe('canTransitionExecution', () => {
    it('UAT Tester can start testing from assigned', () => {
      expect(canTransitionExecution('assigned', 'in_progress', 'UAT Tester')).toBe(true)
    })

    it('UAT Tester can mark test as passed from in_progress', () => {
      expect(canTransitionExecution('in_progress', 'passed', 'UAT Tester')).toBe(true)
    })

    it('UAT Tester can mark test as failed from in_progress', () => {
      expect(canTransitionExecution('in_progress', 'failed', 'UAT Tester')).toBe(true)
    })

    it('UAT Tester cannot skip from assigned to passed', () => {
      expect(canTransitionExecution('assigned', 'passed', 'UAT Tester')).toBe(false)
    })

    it('UAT Manager can verify passed tests', () => {
      expect(canTransitionExecution('passed', 'verified', 'UAT Manager')).toBe(true)
    })

    it('Developer cannot make any execution transitions', () => {
      expect(canTransitionExecution('assigned', 'in_progress', 'Developer')).toBe(false)
      expect(canTransitionExecution('in_progress', 'passed', 'Developer')).toBe(false)
    })

    it('null role cannot make transitions', () => {
      expect(canTransitionExecution('assigned', 'in_progress', null)).toBe(false)
    })
  })

  describe('getExecutionStatusConfig', () => {
    it('returns config for valid status', () => {
      const config = getExecutionStatusConfig('passed')
      expect(config.label).toBe('Passed')
      expect(config.color).toContain('green')
    })

    it('returns fallback for invalid status', () => {
      const config = getExecutionStatusConfig('invalid' as ExecutionStatus)
      expect(config.label).toBe('invalid')
      expect(config.allowedTransitions).toHaveLength(0)
    })
  })
})

describe('Defect Status Configuration', () => {
  const allDefectStatuses: DefectStatus[] = [
    'open',
    'confirmed',
    'in_progress',
    'fixed',
    'verified',
    'closed',
  ]

  describe('DEFECT_STATUS_CONFIG', () => {
    it('defines all defect statuses', () => {
      expect(Object.keys(DEFECT_STATUS_CONFIG)).toHaveLength(6)
    })

    it.each(allDefectStatuses)('%s status has required properties', (status) => {
      const config = DEFECT_STATUS_CONFIG[status]
      expect(config).toBeDefined()
      expect(config.label).toBeDefined()
      expect(config.color).toBeDefined()
      expect(config.allowedTransitions).toBeDefined()
      expect(config.allowedRoles).toBeDefined()
    })

    it('open status can transition to confirmed or closed', () => {
      const transitions = DEFECT_STATUS_CONFIG.open.allowedTransitions
      expect(transitions).toHaveLength(2)
      const targetStatuses = transitions.map((t) => t.to)
      expect(targetStatuses).toContain('confirmed')
      expect(targetStatuses).toContain('closed')
    })

    it('confirmed status can transition to in_progress', () => {
      const transitions = DEFECT_STATUS_CONFIG.confirmed.allowedTransitions
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('in_progress')
    })

    it('in_progress status can transition to fixed', () => {
      const transitions = DEFECT_STATUS_CONFIG.in_progress.allowedTransitions
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('fixed')
    })

    it('fixed status can transition to verified or back to in_progress', () => {
      const transitions = DEFECT_STATUS_CONFIG.fixed.allowedTransitions
      expect(transitions).toHaveLength(2)
      const targetStatuses = transitions.map((t) => t.to)
      expect(targetStatuses).toContain('verified')
      expect(targetStatuses).toContain('in_progress')
    })

    it('verified status can transition to closed', () => {
      const transitions = DEFECT_STATUS_CONFIG.verified.allowedTransitions
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('closed')
    })

    it('closed status can transition back to open (reopen)', () => {
      const transitions = DEFECT_STATUS_CONFIG.closed.allowedTransitions
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('open')
      expect(transitions[0].requiresNotes).toBe(true)
    })
  })

  describe('Defect Lifecycle Flow', () => {
    it('supports full defect lifecycle: open → confirmed → in_progress → fixed → verified → closed', () => {
      // Open can go to confirmed
      expect(
        DEFECT_STATUS_CONFIG.open.allowedTransitions.some((t) => t.to === 'confirmed')
      ).toBe(true)

      // Confirmed can go to in_progress
      expect(
        DEFECT_STATUS_CONFIG.confirmed.allowedTransitions.some((t) => t.to === 'in_progress')
      ).toBe(true)

      // In progress can go to fixed
      expect(
        DEFECT_STATUS_CONFIG.in_progress.allowedTransitions.some((t) => t.to === 'fixed')
      ).toBe(true)

      // Fixed can go to verified
      expect(
        DEFECT_STATUS_CONFIG.fixed.allowedTransitions.some((t) => t.to === 'verified')
      ).toBe(true)

      // Verified can go to closed
      expect(
        DEFECT_STATUS_CONFIG.verified.allowedTransitions.some((t) => t.to === 'closed')
      ).toBe(true)
    })

    it('supports reopening fixed defects if fix failed', () => {
      const reopenTransition = DEFECT_STATUS_CONFIG.fixed.allowedTransitions.find(
        (t) => t.to === 'in_progress'
      )
      expect(reopenTransition).toBeDefined()
      expect(reopenTransition?.label).toBe('Reopen (Fix Failed)')
      expect(reopenTransition?.requiresNotes).toBe(true)
    })

    it('supports closing open defects as not a bug', () => {
      const closeTransition = DEFECT_STATUS_CONFIG.open.allowedTransitions.find(
        (t) => t.to === 'closed'
      )
      expect(closeTransition).toBeDefined()
      expect(closeTransition?.label).toBe('Close (Not a Bug)')
      expect(closeTransition?.requiresNotes).toBe(true)
    })
  })

  describe('getAllowedDefectTransitions', () => {
    it('returns transitions for UAT Manager from open', () => {
      const transitions = getAllowedDefectTransitions('open', 'UAT Manager')
      expect(transitions).toHaveLength(2)
    })

    it('returns empty array for null role', () => {
      const transitions = getAllowedDefectTransitions('open', null)
      expect(transitions).toHaveLength(0)
    })

    it('returns empty array for UAT Tester (not allowed for open status)', () => {
      const transitions = getAllowedDefectTransitions('open', 'UAT Tester')
      expect(transitions).toHaveLength(0)
    })

    it('Program Manager can transition in_progress to fixed', () => {
      const transitions = getAllowedDefectTransitions('in_progress', 'Program Manager')
      expect(transitions).toHaveLength(1)
      expect(transitions[0].to).toBe('fixed')
    })

    it('only Admin and UAT Manager can reopen closed defects', () => {
      const adminTransitions = getAllowedDefectTransitions('closed', 'Admin')
      const managerTransitions = getAllowedDefectTransitions('closed', 'UAT Manager')
      const pmTransitions = getAllowedDefectTransitions('closed', 'Portfolio Manager')

      expect(adminTransitions).toHaveLength(1)
      expect(managerTransitions).toHaveLength(1)
      expect(pmTransitions).toHaveLength(0)
    })
  })

  describe('getDefectStatusConfig', () => {
    it('returns config for valid status', () => {
      const config = getDefectStatusConfig('fixed')
      expect(config.label).toBe('Fixed')
      expect(config.color).toContain('blue')
    })

    it('returns fallback for invalid status', () => {
      const config = getDefectStatusConfig('invalid' as DefectStatus)
      expect(config.label).toBe('invalid')
      expect(config.allowedTransitions).toHaveLength(0)
    })
  })
})

describe('Test Case Status Configuration', () => {
  const allTestCaseStatuses = ['draft', 'ready', 'in_progress', 'completed', 'deprecated']

  describe('TEST_CASE_STATUS_CONFIG', () => {
    it('defines all test case statuses', () => {
      expect(Object.keys(TEST_CASE_STATUS_CONFIG)).toHaveLength(5)
    })

    it.each(allTestCaseStatuses)('%s status has required properties', (status) => {
      const config = TEST_CASE_STATUS_CONFIG[status as keyof typeof TEST_CASE_STATUS_CONFIG]
      expect(config).toBeDefined()
      expect(config.label).toBeDefined()
      expect(config.color).toBeDefined()
    })

    it('draft has muted styling', () => {
      expect(TEST_CASE_STATUS_CONFIG.draft.color).toContain('muted')
    })

    it('ready has blue styling', () => {
      expect(TEST_CASE_STATUS_CONFIG.ready.color).toContain('blue')
    })

    it('completed has green styling', () => {
      expect(TEST_CASE_STATUS_CONFIG.completed.color).toContain('green')
    })

    it('deprecated has gray styling', () => {
      expect(TEST_CASE_STATUS_CONFIG.deprecated.color).toContain('gray')
    })
  })
})

describe('Permission Helpers', () => {
  const allRoles: UserRole[] = [
    'Admin',
    'Portfolio Manager',
    'Program Manager',
    'UAT Manager',
    'UAT Tester',
    'Developer',
  ]

  describe('canGenerateTestCases', () => {
    it('returns false for null role', () => {
      expect(canGenerateTestCases(null)).toBe(false)
    })

    it('Admin can generate test cases', () => {
      expect(canGenerateTestCases('Admin')).toBe(true)
    })

    it('Portfolio Manager can generate test cases', () => {
      expect(canGenerateTestCases('Portfolio Manager')).toBe(true)
    })

    it('Program Manager can generate test cases', () => {
      expect(canGenerateTestCases('Program Manager')).toBe(true)
    })

    it('UAT Manager can generate test cases', () => {
      expect(canGenerateTestCases('UAT Manager')).toBe(true)
    })

    it('UAT Tester cannot generate test cases', () => {
      expect(canGenerateTestCases('UAT Tester')).toBe(false)
    })

    it('Developer cannot generate test cases', () => {
      expect(canGenerateTestCases('Developer')).toBe(false)
    })
  })

  describe('canCreateTestCases', () => {
    it('returns false for null role', () => {
      expect(canCreateTestCases(null)).toBe(false)
    })

    it('Admin can create test cases', () => {
      expect(canCreateTestCases('Admin')).toBe(true)
    })

    it('UAT Tester cannot create test cases', () => {
      expect(canCreateTestCases('UAT Tester')).toBe(false)
    })
  })

  describe('canAssignTesters', () => {
    it('returns false for null role', () => {
      expect(canAssignTesters(null)).toBe(false)
    })

    it('UAT Manager can assign testers', () => {
      expect(canAssignTesters('UAT Manager')).toBe(true)
    })

    it('UAT Tester cannot assign testers', () => {
      expect(canAssignTesters('UAT Tester')).toBe(false)
    })

    it('Developer cannot assign testers', () => {
      expect(canAssignTesters('Developer')).toBe(false)
    })
  })

  describe('canExecuteTests', () => {
    it('returns false for null role', () => {
      expect(canExecuteTests(null)).toBe(false)
    })

    it('Admin can execute tests', () => {
      expect(canExecuteTests('Admin')).toBe(true)
    })

    it('UAT Manager can execute tests', () => {
      expect(canExecuteTests('UAT Manager')).toBe(true)
    })

    it('UAT Tester can execute tests', () => {
      expect(canExecuteTests('UAT Tester')).toBe(true)
    })

    it('Portfolio Manager cannot execute tests', () => {
      expect(canExecuteTests('Portfolio Manager')).toBe(false)
    })

    it('Program Manager cannot execute tests', () => {
      expect(canExecuteTests('Program Manager')).toBe(false)
    })

    it('Developer cannot execute tests', () => {
      expect(canExecuteTests('Developer')).toBe(false)
    })
  })

  describe('canVerifyResults', () => {
    it('returns false for null role', () => {
      expect(canVerifyResults(null)).toBe(false)
    })

    it('Admin can verify results', () => {
      expect(canVerifyResults('Admin')).toBe(true)
    })

    it('Portfolio Manager can verify results', () => {
      expect(canVerifyResults('Portfolio Manager')).toBe(true)
    })

    it('UAT Manager can verify results', () => {
      expect(canVerifyResults('UAT Manager')).toBe(true)
    })

    it('UAT Tester cannot verify results', () => {
      expect(canVerifyResults('UAT Tester')).toBe(false)
    })

    it('Program Manager cannot verify results', () => {
      expect(canVerifyResults('Program Manager')).toBe(false)
    })
  })

  describe('canCreateDefects', () => {
    it('returns false for null role', () => {
      expect(canCreateDefects(null)).toBe(false)
    })

    it('all roles except Developer can create defects', () => {
      expect(canCreateDefects('Admin')).toBe(true)
      expect(canCreateDefects('Portfolio Manager')).toBe(true)
      expect(canCreateDefects('Program Manager')).toBe(true)
      expect(canCreateDefects('UAT Manager')).toBe(true)
      expect(canCreateDefects('UAT Tester')).toBe(true)
    })

    it('Developer cannot create defects', () => {
      expect(canCreateDefects('Developer')).toBe(false)
    })
  })

  describe('canResolveDefects', () => {
    it('returns false for null role', () => {
      expect(canResolveDefects(null)).toBe(false)
    })

    it('Admin can resolve defects', () => {
      expect(canResolveDefects('Admin')).toBe(true)
    })

    it('Portfolio Manager can resolve defects', () => {
      expect(canResolveDefects('Portfolio Manager')).toBe(true)
    })

    it('UAT Manager can resolve defects', () => {
      expect(canResolveDefects('UAT Manager')).toBe(true)
    })

    it('Program Manager cannot resolve defects', () => {
      expect(canResolveDefects('Program Manager')).toBe(false)
    })

    it('UAT Tester cannot resolve defects', () => {
      expect(canResolveDefects('UAT Tester')).toBe(false)
    })
  })
})

describe('Validation Workflow Integration', () => {
  describe('Test Execution Workflow', () => {
    it('supports standard test execution: assigned → in_progress → passed → verified', () => {
      // UAT Tester starts from assigned
      expect(canTransitionExecution('assigned', 'in_progress', 'UAT Tester')).toBe(true)

      // UAT Tester marks as passed
      expect(canTransitionExecution('in_progress', 'passed', 'UAT Tester')).toBe(true)

      // UAT Manager verifies the result
      expect(canTransitionExecution('passed', 'verified', 'UAT Manager')).toBe(true)
    })

    it('supports failed test workflow: in_progress → failed → in_progress → passed', () => {
      // UAT Tester marks as failed
      expect(canTransitionExecution('in_progress', 'failed', 'UAT Tester')).toBe(true)

      // After defect fix, UAT Tester re-tests
      expect(canTransitionExecution('failed', 'in_progress', 'UAT Tester')).toBe(true)

      // UAT Tester can then mark as passed
      expect(canTransitionExecution('in_progress', 'passed', 'UAT Tester')).toBe(true)
    })

    it('supports blocked test workflow: in_progress → blocked → in_progress', () => {
      // UAT Tester marks as blocked
      expect(canTransitionExecution('in_progress', 'blocked', 'UAT Tester')).toBe(true)

      // Once unblocked, resume testing
      expect(canTransitionExecution('blocked', 'in_progress', 'UAT Tester')).toBe(true)
    })
  })

  describe('Defect Resolution Workflow', () => {
    it('supports standard defect resolution: open → confirmed → in_progress → fixed → verified → closed', () => {
      // UAT Manager confirms the defect
      const openTransitions = getAllowedDefectTransitions('open', 'UAT Manager')
      expect(openTransitions.some((t) => t.to === 'confirmed')).toBe(true)

      // Developer/PM starts the fix
      const confirmedTransitions = getAllowedDefectTransitions('confirmed', 'UAT Manager')
      expect(confirmedTransitions.some((t) => t.to === 'in_progress')).toBe(true)

      // Developer marks as fixed
      const inProgressTransitions = getAllowedDefectTransitions('in_progress', 'Program Manager')
      expect(inProgressTransitions.some((t) => t.to === 'fixed')).toBe(true)

      // UAT Manager verifies the fix
      const fixedTransitions = getAllowedDefectTransitions('fixed', 'UAT Manager')
      expect(fixedTransitions.some((t) => t.to === 'verified')).toBe(true)

      // UAT Manager closes the defect
      const verifiedTransitions = getAllowedDefectTransitions('verified', 'UAT Manager')
      expect(verifiedTransitions.some((t) => t.to === 'closed')).toBe(true)
    })

    it('supports rejecting invalid defects: open → closed (Not a Bug)', () => {
      const transitions = getAllowedDefectTransitions('open', 'UAT Manager')
      const closeTransition = transitions.find((t) => t.to === 'closed')
      expect(closeTransition).toBeDefined()
      expect(closeTransition?.requiresNotes).toBe(true)
    })
  })

  describe('Role Separation in UAT', () => {
    it('UAT Tester can execute but cannot verify', () => {
      expect(canExecuteTests('UAT Tester')).toBe(true)
      expect(canVerifyResults('UAT Tester')).toBe(false)
    })

    it('UAT Manager can both execute and verify', () => {
      expect(canExecuteTests('UAT Manager')).toBe(true)
      expect(canVerifyResults('UAT Manager')).toBe(true)
    })

    it('Portfolio Manager can verify but cannot execute', () => {
      expect(canExecuteTests('Portfolio Manager')).toBe(false)
      expect(canVerifyResults('Portfolio Manager')).toBe(true)
    })
  })

  describe('Status Color Consistency', () => {
    it('green colors indicate success/completion', () => {
      expect(EXECUTION_STATUS_CONFIG.passed.color).toContain('green')
      expect(EXECUTION_STATUS_CONFIG.verified.color).toContain('emerald')
      expect(DEFECT_STATUS_CONFIG.verified.color).toContain('green')
      expect(TEST_CASE_STATUS_CONFIG.completed.color).toContain('green')
    })

    it('red colors indicate failure/issues', () => {
      expect(EXECUTION_STATUS_CONFIG.failed.color).toContain('red')
      expect(DEFECT_STATUS_CONFIG.open.color).toContain('red')
    })

    it('yellow colors indicate in-progress', () => {
      expect(EXECUTION_STATUS_CONFIG.in_progress.color).toContain('yellow')
      expect(DEFECT_STATUS_CONFIG.in_progress.color).toContain('yellow')
      expect(TEST_CASE_STATUS_CONFIG.in_progress.color).toContain('yellow')
    })

    it('blue colors indicate assigned/ready states', () => {
      expect(EXECUTION_STATUS_CONFIG.assigned.color).toContain('blue')
      expect(DEFECT_STATUS_CONFIG.fixed.color).toContain('blue')
      expect(TEST_CASE_STATUS_CONFIG.ready.color).toContain('blue')
    })
  })
})
