import type { ExecutionStatus, UserRole, DefectStatus, TestCaseStatus } from "@/types/database"

// ============================================================================
// Execution Status Transitions
// ============================================================================

export interface ExecutionTransition {
  to: ExecutionStatus
  label: string
  requiresNotes: boolean
}

export interface ExecutionStatusConfig {
  label: string
  color: string
  allowedTransitions: ExecutionTransition[]
  allowedRoles: UserRole[]
}

export const EXECUTION_STATUS_CONFIG: Record<ExecutionStatus, ExecutionStatusConfig> = {
  assigned: {
    label: "Assigned",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    allowedTransitions: [
      { to: "in_progress", label: "Start Testing", requiresNotes: false },
    ],
    allowedRoles: ["Admin", "UAT Manager", "UAT Tester"],
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    allowedTransitions: [
      { to: "passed", label: "Mark as Passed", requiresNotes: false },
      { to: "failed", label: "Mark as Failed", requiresNotes: true },
      { to: "blocked", label: "Mark as Blocked", requiresNotes: true },
    ],
    allowedRoles: ["Admin", "UAT Manager", "UAT Tester"],
  },
  passed: {
    label: "Passed",
    color: "bg-green-100 text-green-800 border-green-200",
    allowedTransitions: [
      { to: "verified", label: "Verify Result", requiresNotes: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "UAT Manager"],
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-800 border-red-200",
    allowedTransitions: [
      { to: "in_progress", label: "Re-test", requiresNotes: false },
    ],
    allowedRoles: ["Admin", "UAT Manager", "UAT Tester"],
  },
  blocked: {
    label: "Blocked",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    allowedTransitions: [
      { to: "in_progress", label: "Resume Testing", requiresNotes: false },
    ],
    allowedRoles: ["Admin", "UAT Manager", "UAT Tester"],
  },
  verified: {
    label: "Verified",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    allowedTransitions: [],
    allowedRoles: [],
  },
}

export function getAllowedExecutionTransitions(
  currentStatus: ExecutionStatus,
  userRole: UserRole | null
): ExecutionTransition[] {
  const config = EXECUTION_STATUS_CONFIG[currentStatus]
  if (!config || !userRole) return []
  if (!config.allowedRoles.includes(userRole)) return []
  return config.allowedTransitions
}

export function canTransitionExecution(
  currentStatus: ExecutionStatus,
  targetStatus: ExecutionStatus,
  userRole: UserRole | null
): boolean {
  const allowed = getAllowedExecutionTransitions(currentStatus, userRole)
  return allowed.some(t => t.to === targetStatus)
}

export function getExecutionStatusConfig(status: ExecutionStatus): ExecutionStatusConfig {
  return EXECUTION_STATUS_CONFIG[status] || {
    label: status,
    color: "bg-muted text-muted-foreground border-border",
    allowedTransitions: [],
    allowedRoles: [],
  }
}

// ============================================================================
// Defect Status Transitions
// ============================================================================

export interface DefectTransition {
  to: DefectStatus
  label: string
  requiresNotes: boolean
}

export interface DefectStatusConfig {
  label: string
  color: string
  allowedTransitions: DefectTransition[]
  allowedRoles: UserRole[]
}

export const DEFECT_STATUS_CONFIG: Record<DefectStatus, DefectStatusConfig> = {
  open: {
    label: "Open",
    color: "bg-red-100 text-red-800 border-red-200",
    allowedTransitions: [
      { to: "confirmed", label: "Confirm Defect", requiresNotes: false },
      { to: "closed", label: "Close (Not a Bug)", requiresNotes: true },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "UAT Manager"],
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    allowedTransitions: [
      { to: "in_progress", label: "Start Fix", requiresNotes: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "UAT Manager"],
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    allowedTransitions: [
      { to: "fixed", label: "Mark as Fixed", requiresNotes: true },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"],
  },
  fixed: {
    label: "Fixed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    allowedTransitions: [
      { to: "verified", label: "Verify Fix", requiresNotes: false },
      { to: "in_progress", label: "Reopen (Fix Failed)", requiresNotes: true },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "UAT Manager"],
  },
  verified: {
    label: "Verified",
    color: "bg-green-100 text-green-800 border-green-200",
    allowedTransitions: [
      { to: "closed", label: "Close Defect", requiresNotes: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "UAT Manager"],
  },
  closed: {
    label: "Closed",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    allowedTransitions: [
      { to: "open", label: "Reopen", requiresNotes: true },
    ],
    allowedRoles: ["Admin", "UAT Manager"],
  },
}

export function getAllowedDefectTransitions(
  currentStatus: DefectStatus,
  userRole: UserRole | null
): DefectTransition[] {
  const config = DEFECT_STATUS_CONFIG[currentStatus]
  if (!config || !userRole) return []
  if (!config.allowedRoles.includes(userRole)) return []
  return config.allowedTransitions
}

export function getDefectStatusConfig(status: DefectStatus): DefectStatusConfig {
  return DEFECT_STATUS_CONFIG[status] || {
    label: status,
    color: "bg-muted text-muted-foreground border-border",
    allowedTransitions: [],
    allowedRoles: [],
  }
}

// ============================================================================
// Test Case Status Config
// ============================================================================

export interface TestCaseStatusConfig {
  label: string
  color: string
}

export const TEST_CASE_STATUS_CONFIG: Record<TestCaseStatus, TestCaseStatusConfig> = {
  draft: {
    label: "Draft",
    color: "bg-muted text-muted-foreground border-border",
  },
  ready: {
    label: "Ready",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  deprecated: {
    label: "Deprecated",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
}

// ============================================================================
// Permission Helpers
// ============================================================================

export function canGenerateTestCases(role: UserRole | null): boolean {
  if (!role) return false
  return ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(role)
}

export function canCreateTestCases(role: UserRole | null): boolean {
  if (!role) return false
  return ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(role)
}

export function canAssignTesters(role: UserRole | null): boolean {
  if (!role) return false
  return ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(role)
}

export function canExecuteTests(role: UserRole | null): boolean {
  if (!role) return false
  return ["Admin", "UAT Manager", "UAT Tester"].includes(role)
}

export function canVerifyResults(role: UserRole | null): boolean {
  if (!role) return false
  return ["Admin", "Portfolio Manager", "UAT Manager"].includes(role)
}

export function canCreateDefects(role: UserRole | null): boolean {
  if (!role) return false
  return ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager", "UAT Tester"].includes(role)
}

export function canResolveDefects(role: UserRole | null): boolean {
  if (!role) return false
  return ["Admin", "Portfolio Manager", "UAT Manager"].includes(role)
}
