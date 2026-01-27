import type { StoryStatus, UserRole } from "@/types/database"

// Which roles should be notified for each status change
export const STATUS_NOTIFICATION_RULES: Record<StoryStatus, {
  notifyRoles: UserRole[]
  subject: string
  description: string
}> = {
  "Draft": {
    notifyRoles: [], // No notifications for drafts
    subject: "Story returned to Draft",
    description: "A story has been returned to draft status",
  },
  "Internal Review": {
    notifyRoles: ["Admin", "Portfolio Manager", "Program Manager"],
    subject: "Story ready for Internal Review",
    description: "A story is ready for internal review",
  },
  "Pending Client Review": {
    notifyRoles: ["Admin", "Portfolio Manager"],
    subject: "Story ready for Client Review",
    description: "A story has been approved internally and is ready for client review",
  },
  "Approved": {
    notifyRoles: ["Admin", "Portfolio Manager", "Program Manager", "Developer"],
    subject: "Story Approved by Client",
    description: "A story has been approved by the client",
  },
  "In Development": {
    notifyRoles: ["Developer", "Program Manager"],
    subject: "Story moved to Development",
    description: "A story has been moved to development",
  },
  "In UAT": {
    notifyRoles: ["Admin", "Portfolio Manager", "Program Manager"],
    subject: "Story ready for UAT",
    description: "A story has been moved to UAT testing",
  },
  "Needs Discussion": {
    notifyRoles: ["Admin", "Portfolio Manager", "Program Manager"],
    subject: "Story flagged for Discussion",
    description: "A story has been flagged as needing discussion",
  },
  "Out of Scope": {
    notifyRoles: ["Admin", "Portfolio Manager"],
    subject: "Story marked Out of Scope",
    description: "A story has been marked as out of scope",
  },
}

// Notification types users can opt into/out of
export const NOTIFICATION_TYPES = {
  status_changes: {
    key: "status_changes",
    label: "Status Changes",
    description: "Get notified when stories change status",
    defaultEnabled: true,
  },
  comments: {
    key: "comments",
    label: "New Comments",
    description: "Get notified when someone comments on stories you're involved with",
    defaultEnabled: true,
  },
  approvals: {
    key: "approvals",
    label: "Approval Requests",
    description: "Get notified when stories need your approval",
    defaultEnabled: true,
  },
  mentions: {
    key: "mentions",
    label: "Mentions",
    description: "Get notified when someone mentions you in a comment",
    defaultEnabled: true,
  },
} as const

export type NotificationType = keyof typeof NOTIFICATION_TYPES

export interface UserNotificationPreferences {
  email_enabled: boolean
  status_changes: boolean
  comments: boolean
  approvals: boolean
  mentions: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
  email_enabled: true,
  status_changes: true,
  comments: true,
  approvals: true,
  mentions: true,
}
