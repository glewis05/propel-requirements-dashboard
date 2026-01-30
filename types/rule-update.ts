// Rule Update TypeScript Types

import type { Json } from "./database"
import type {
  StoryType,
  RuleType,
  Platform,
  ChangeType,
  TestType,
  TestCaseStatus,
  HistoryAction,
} from "@/lib/rule-update/constants"

// Re-export types from constants for convenience
export type {
  StoryType,
  RuleType,
  Platform,
  ChangeType,
  TestType,
  TestCaseStatus,
  HistoryAction,
}

// Test step structure
export interface RuleTestStep {
  step_number: number
  navigation_path: string
  action: string
  note?: string
}

// Patient conditions structure
export interface PatientConditions {
  PHX?: string
  FDR?: string
  SDR?: string
  [key: string]: string | undefined
}

// Rule update details (1:1 with story)
export interface RuleUpdateDetails {
  id: string
  story_id: string
  rule_type: RuleType
  target_rule: string
  change_id: string
  change_type: ChangeType
  quarter: string
  effective_date: string | null
  rule_description: string | null
  change_summary: string | null
  created_at: string
  updated_at: string
}

// For creating/updating rule update details
export interface RuleUpdateDetailsInput {
  rule_type: RuleType
  target_rule: string
  change_id: string
  change_type: ChangeType
  quarter: string
  effective_date?: string | null
  rule_description?: string | null
  change_summary?: string | null
}

// Rule test case
export interface RuleTestCase {
  test_id: string
  story_id: string
  profile_id: string
  platform: Platform
  test_type: TestType
  sequence_number: number
  patient_conditions: PatientConditions
  expected_result: string | null
  cross_trigger_check: string | null
  test_steps: RuleTestStep[]
  status: TestCaseStatus
  created_at: string
  updated_at: string
}

// For creating/updating test cases
export interface RuleTestCaseInput {
  platform: Platform
  test_type: TestType
  patient_conditions: PatientConditions
  expected_result?: string | null
  cross_trigger_check?: string | null
  test_steps?: RuleTestStep[]
  status?: TestCaseStatus
}

// Rule update history entry
export interface RuleUpdateHistoryEntry {
  history_id: string
  story_id: string
  test_id: string | null
  action: HistoryAction
  previous_data: Json | null
  new_data: Json | null
  changed_by: string
  changed_by_name: string | null
  ip_address: string | null
  created_at: string
}

// Combined rule update story data
export interface RuleUpdateStoryData {
  // Base story fields
  title: string
  program_id: string
  status: string
  priority?: string | null

  // Rule update specific fields
  story_type: "rule_update"
  rule_details: RuleUpdateDetailsInput
  test_cases?: RuleTestCaseInput[]
}

// Full rule update story with all related data
export interface RuleUpdateStoryFull {
  story_id: string
  title: string
  program_id: string
  status: string
  priority: string | null
  story_type: "rule_update"
  version: number
  created_at: string
  updated_at: string
  rule_details: RuleUpdateDetails
  test_cases: RuleTestCase[]
}

// For story list display with rule info
export interface StoryWithRuleInfo {
  story_id: string
  title: string
  status: string
  priority: string | null
  program_id: string
  updated_at: string
  story_type: StoryType
  rule_type?: RuleType
  target_rule?: string
}

// Profile ID generation params
export interface ProfileIdParams {
  story_id: string
  platform: Platform
  test_type: TestType
}

// Audit context for history logging
export interface AuditContext {
  user_id: string
  user_name?: string
  ip_address?: string
}
