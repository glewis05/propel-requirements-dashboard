import { z } from "zod"
import {
  RULE_TYPES,
  PLATFORMS,
  CHANGE_TYPES,
  TEST_TYPES,
  TEST_CASE_STATUS,
} from "@/lib/rule-update/constants"

// Test step schema
export const ruleTestStepSchema = z.object({
  step_number: z.number().int().positive(),
  navigation_path: z.string().min(1, "Navigation path is required").max(500),
  action: z.string().min(1, "Action is required").max(500),
  note: z.string().max(500).optional(),
})

export type RuleTestStepFormData = z.infer<typeof ruleTestStepSchema>

// Patient conditions schema
export const patientConditionsSchema = z.object({
  PHX: z.string().max(500).optional(),
  FDR: z.string().max(500).optional(),
  SDR: z.string().max(500).optional(),
}).catchall(z.string().max(500).optional())

export type PatientConditionsFormData = z.infer<typeof patientConditionsSchema>

// Rule update details schema
export const ruleUpdateDetailsSchema = z.object({
  rule_type: z.enum([RULE_TYPES.NCCN, RULE_TYPES.TC], {
    required_error: "Rule type is required",
  }),
  target_rule: z
    .string()
    .min(1, "Target rule is required")
    .max(50, "Target rule must be less than 50 characters")
    .regex(
      /^(NCCN|TC)-[A-Z]{2,6}-\d{3}$/,
      "Target rule must follow pattern: NCCN-XXXX-000 or TC-XXXX-000"
    ),
  change_id: z
    .string()
    .min(1, "Change ID is required")
    .max(20, "Change ID must be less than 20 characters"),
  change_type: z.enum([CHANGE_TYPES.MODIFIED, CHANGE_TYPES.NEW, CHANGE_TYPES.DEPRECATED], {
    required_error: "Change type is required",
  }),
  quarter: z
    .string()
    .min(1, "Quarter is required")
    .regex(/^\d{4} Q[1-4]$/, "Quarter must follow pattern: YYYY Q#"),
  effective_date: z.string().nullable().optional(),
  rule_description: z
    .string()
    .max(5000, "Rule description must be less than 5000 characters")
    .nullable()
    .optional(),
  change_summary: z
    .string()
    .max(2000, "Change summary must be less than 2000 characters")
    .nullable()
    .optional(),
})

export type RuleUpdateDetailsFormData = z.infer<typeof ruleUpdateDetailsSchema>

// Test case schema (for adding/editing individual test cases)
export const ruleTestCaseSchema = z.object({
  platform: z.enum([PLATFORMS.P4M, PLATFORMS.PX4M], {
    required_error: "Platform is required",
  }),
  test_type: z.enum([TEST_TYPES.POS, TEST_TYPES.NEG], {
    required_error: "Test type is required",
  }),
  patient_conditions: patientConditionsSchema,
  expected_result: z
    .string()
    .max(500, "Expected result must be less than 500 characters")
    .nullable()
    .optional(),
  cross_trigger_check: z
    .string()
    .max(500, "Cross trigger check must be less than 500 characters")
    .nullable()
    .optional(),
  test_steps: z.array(ruleTestStepSchema).default([]),
  status: z
    .enum([
      TEST_CASE_STATUS.DRAFT,
      TEST_CASE_STATUS.READY,
      TEST_CASE_STATUS.PASSED,
      TEST_CASE_STATUS.FAILED,
    ])
    .default(TEST_CASE_STATUS.DRAFT),
})

export type RuleTestCaseFormData = z.infer<typeof ruleTestCaseSchema>

// Full rule update story schema (for creation)
export const ruleUpdateStorySchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  program_id: z.string().min(1, "Program is required"),
  status: z.enum([
    "Draft",
    "Internal Review",
    "Pending Client Review",
    "Approved",
    "In Development",
    "In UAT",
    "Needs Discussion",
    "Out of Scope",
  ]),
  priority: z.enum(["Must Have", "Should Have", "Could Have", "Would Have"]).nullable().optional(),

  // Rule details
  rule_details: ruleUpdateDetailsSchema,

  // Optional test cases to create with the story
  test_cases: z.array(ruleTestCaseSchema).optional(),
})

export type RuleUpdateStoryFormData = z.infer<typeof ruleUpdateStorySchema>

// Schema for updating rule details only
export const updateRuleDetailsSchema = ruleUpdateDetailsSchema.partial().extend({
  rule_type: ruleUpdateDetailsSchema.shape.rule_type.optional(),
  target_rule: ruleUpdateDetailsSchema.shape.target_rule.optional(),
  change_id: ruleUpdateDetailsSchema.shape.change_id.optional(),
  change_type: ruleUpdateDetailsSchema.shape.change_type.optional(),
  quarter: ruleUpdateDetailsSchema.shape.quarter.optional(),
})

export type UpdateRuleDetailsFormData = z.infer<typeof updateRuleDetailsSchema>

// Helper to extract rule code from target_rule
export function extractRuleCode(targetRule: string): string {
  // NCCN-PROS-007 -> PROS007
  return targetRule.replace(/^(NCCN|TC)-/, "").replace(/-/g, "")
}

// Helper to generate profile ID format (for preview, actual generation on server)
export function formatProfileId(
  ruleCode: string,
  testType: string,
  sequence: number,
  platform: string
): string {
  return `TP-${ruleCode}-${testType}-${sequence.toString().padStart(2, "0")}-${platform}`
}
