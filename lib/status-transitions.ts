import type { StoryStatus, UserRole } from "@/types/database"

export interface StatusTransition {
  to: StoryStatus
  label: string
  requiresNotes: boolean
  requiresApproval: boolean
  approvalType?: "internal_review" | "stakeholder" | "portfolio"
}

export interface StatusConfig {
  label: string
  color: string
  allowedTransitions: StatusTransition[]
  allowedRoles: UserRole[]
}

// Status workflow configuration
// Defines which transitions are allowed from each status and who can perform them
export const STATUS_CONFIG: Record<StoryStatus, StatusConfig> = {
  Draft: {
    label: "Draft",
    color: "bg-muted text-muted-foreground border-border",
    allowedTransitions: [
      { to: "Internal Review", label: "Submit for Internal Review", requiresNotes: false, requiresApproval: false },
      { to: "Needs Discussion", label: "Flag for Discussion", requiresNotes: true, requiresApproval: false },
      { to: "Out of Scope", label: "Mark Out of Scope", requiresNotes: true, requiresApproval: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "Program Manager"],
  },
  "Internal Review": {
    label: "Internal Review",
    color: "bg-primary/10 text-primary border-primary/20",
    allowedTransitions: [
      { to: "Pending Client Review", label: "Approve & Send to Client", requiresNotes: false, requiresApproval: true, approvalType: "internal_review" },
      { to: "Draft", label: "Return to Draft", requiresNotes: true, requiresApproval: false },
      { to: "Needs Discussion", label: "Flag for Discussion", requiresNotes: true, requiresApproval: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "Program Manager"],
  },
  "Pending Client Review": {
    label: "Pending Client Review",
    color: "bg-warning/10 text-warning border-warning/20",
    allowedTransitions: [
      { to: "Approved", label: "Client Approved", requiresNotes: false, requiresApproval: true, approvalType: "stakeholder" },
      { to: "Needs Discussion", label: "Client Needs Discussion", requiresNotes: true, requiresApproval: false },
      { to: "Internal Review", label: "Return to Internal Review", requiresNotes: true, requiresApproval: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "Program Manager"],
  },
  Approved: {
    label: "Approved",
    color: "bg-success/10 text-success border-success/20",
    allowedTransitions: [
      { to: "In Development", label: "Start Development", requiresNotes: false, requiresApproval: false },
      { to: "Needs Discussion", label: "Flag for Discussion", requiresNotes: true, requiresApproval: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "Program Manager"],
  },
  "In Development": {
    label: "In Development",
    color: "bg-cyan/10 text-cyan-700 border-cyan/20",
    allowedTransitions: [
      { to: "In UAT", label: "Move to UAT", requiresNotes: false, requiresApproval: false },
      { to: "Needs Discussion", label: "Flag for Discussion", requiresNotes: true, requiresApproval: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "Program Manager", "Developer"],
  },
  "In UAT": {
    label: "In UAT",
    color: "bg-secondary/10 text-secondary border-secondary/20",
    allowedTransitions: [
      { to: "Approved", label: "UAT Complete - Accept", requiresNotes: false, requiresApproval: false },
      { to: "In Development", label: "Return to Development", requiresNotes: true, requiresApproval: false },
      { to: "Needs Discussion", label: "Flag for Discussion", requiresNotes: true, requiresApproval: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"],
  },
  "Needs Discussion": {
    label: "Needs Discussion",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    allowedTransitions: [
      { to: "Draft", label: "Return to Draft", requiresNotes: false, requiresApproval: false },
      { to: "Internal Review", label: "Submit for Internal Review", requiresNotes: false, requiresApproval: false },
      { to: "Pending Client Review", label: "Send to Client Review", requiresNotes: false, requiresApproval: false },
      { to: "Out of Scope", label: "Mark Out of Scope", requiresNotes: true, requiresApproval: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager", "Program Manager"],
  },
  "Out of Scope": {
    label: "Out of Scope",
    color: "bg-muted text-muted-foreground border-border",
    allowedTransitions: [
      { to: "Draft", label: "Reopen as Draft", requiresNotes: true, requiresApproval: false },
    ],
    allowedRoles: ["Admin", "Portfolio Manager"],
  },
}

// Get allowed transitions for a status and role
export function getAllowedTransitions(
  currentStatus: StoryStatus,
  userRole: UserRole | null
): StatusTransition[] {
  const config = STATUS_CONFIG[currentStatus]
  if (!config || !userRole) return []

  // Check if user role is allowed to transition from this status
  if (!config.allowedRoles.includes(userRole)) return []

  return config.allowedTransitions
}

// Check if a specific transition is allowed
export function canTransition(
  currentStatus: StoryStatus,
  targetStatus: StoryStatus,
  userRole: UserRole | null
): boolean {
  const allowed = getAllowedTransitions(currentStatus, userRole)
  return allowed.some(t => t.to === targetStatus)
}

// Get status display configuration
export function getStatusConfig(status: StoryStatus): StatusConfig {
  return STATUS_CONFIG[status] || {
    label: status,
    color: "bg-muted text-muted-foreground border-border",
    allowedTransitions: [],
    allowedRoles: [],
  }
}
