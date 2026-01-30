// Rule Update Constants

// Story types
export const STORY_TYPES = {
  USER_STORY: "user_story",
  RULE_UPDATE: "rule_update",
} as const

export type StoryType = (typeof STORY_TYPES)[keyof typeof STORY_TYPES]

// Rule types
export const RULE_TYPES = {
  NCCN: "NCCN",
  TC: "TC",
} as const

export type RuleType = (typeof RULE_TYPES)[keyof typeof RULE_TYPES]

export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  NCCN: "NCCN Guidelines",
  TC: "Tyrer-Cuzick",
}

// Platforms
export const PLATFORMS = {
  P4M: "P4M",
  PX4M: "Px4M",
} as const

export type Platform = (typeof PLATFORMS)[keyof typeof PLATFORMS]

export const PLATFORM_LABELS: Record<Platform, string> = {
  P4M: "Preventione4ME",
  Px4M: "Precision4ME",
}

// Change types
export const CHANGE_TYPES = {
  MODIFIED: "MODIFIED",
  NEW: "NEW",
  DEPRECATED: "DEPRECATED",
} as const

export type ChangeType = (typeof CHANGE_TYPES)[keyof typeof CHANGE_TYPES]

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  MODIFIED: "Modified",
  NEW: "New Rule",
  DEPRECATED: "Deprecated",
}

export const CHANGE_TYPE_COLORS: Record<ChangeType, string> = {
  MODIFIED: "bg-warning/10 text-warning border-warning/20",
  NEW: "bg-success/10 text-success border-success/20",
  DEPRECATED: "bg-destructive/10 text-destructive border-destructive/20",
}

// Test types
export const TEST_TYPES = {
  POS: "POS",
  NEG: "NEG",
} as const

export type TestType = (typeof TEST_TYPES)[keyof typeof TEST_TYPES]

export const TEST_TYPE_LABELS: Record<TestType, string> = {
  POS: "Positive",
  NEG: "Negative",
}

export const TEST_TYPE_COLORS: Record<TestType, string> = {
  POS: "bg-success/10 text-success border-success/20",
  NEG: "bg-destructive/10 text-destructive border-destructive/20",
}

// Test case status
export const TEST_CASE_STATUS = {
  DRAFT: "draft",
  READY: "ready",
  PASSED: "passed",
  FAILED: "failed",
} as const

export type TestCaseStatus = (typeof TEST_CASE_STATUS)[keyof typeof TEST_CASE_STATUS]

export const TEST_CASE_STATUS_LABELS: Record<TestCaseStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  passed: "Passed",
  failed: "Failed",
}

export const TEST_CASE_STATUS_COLORS: Record<TestCaseStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  ready: "bg-primary/10 text-primary border-primary/20",
  passed: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
}

// History actions
export const HISTORY_ACTIONS = {
  CREATED: "created",
  UPDATED: "updated",
  TEST_ADDED: "test_added",
  TEST_MODIFIED: "test_modified",
  TEST_DELETED: "test_deleted",
  DETAILS_UPDATED: "details_updated",
} as const

export type HistoryAction = (typeof HISTORY_ACTIONS)[keyof typeof HISTORY_ACTIONS]

export const HISTORY_ACTION_LABELS: Record<HistoryAction, string> = {
  created: "Created",
  updated: "Updated",
  test_added: "Test Case Added",
  test_modified: "Test Case Modified",
  test_deleted: "Test Case Deleted",
  details_updated: "Details Updated",
}

// Patient condition keys
export const PATIENT_CONDITION_KEYS = {
  PHX: "PHX",
  FDR: "FDR",
  SDR: "SDR",
} as const

export const PATIENT_CONDITION_LABELS: Record<string, string> = {
  PHX: "Personal History",
  FDR: "First Degree Relative",
  SDR: "Second Degree Relative",
}

// Quarter options (generate current + next 4 quarters)
export function generateQuarterOptions(): string[] {
  const quarters: string[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)

  for (let i = 0; i < 6; i++) {
    const quarter = ((currentQuarter - 1 + i) % 4) + 1
    const year = currentYear + Math.floor((currentQuarter - 1 + i) / 4)
    quarters.push(`${year} Q${quarter}`)
  }

  return quarters
}

// Common rule patterns for validation
export const RULE_PATTERN = /^(NCCN|TC)-[A-Z]{2,6}-\d{3}$/

// Change ID pattern (e.g., 25Q4R-01)
export const CHANGE_ID_PATTERN = /^\d{2}Q[1-4]R-\d{2,3}$/
