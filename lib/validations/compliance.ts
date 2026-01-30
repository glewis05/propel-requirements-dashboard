import { z } from "zod"
import { COMPLIANCE_STATUSES, REQUIREMENT_LEVELS } from "@/lib/compliance/constants"

// ============================================================================
// COMPLIANCE STATUS ENUM
// ============================================================================

export const complianceStatusSchema = z.enum([
  "not_applicable",
  "not_started",
  "planned",
  "in_progress",
  "implemented",
  "verified",
  "deferred",
])

export const requirementLevelSchema = z.enum([
  "required",
  "addressable",
  "recommended",
])

// ============================================================================
// EVIDENCE LINK SCHEMA
// ============================================================================

export const evidenceLinkSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  description: z.string().min(1, "Description is required").max(500),
  uploaded_at: z.string().datetime().optional(),
})

// ============================================================================
// COMPLIANCE MAPPING SCHEMAS
// ============================================================================

export const createComplianceMappingSchema = z.object({
  story_id: z.string().min(1, "Story ID is required"),
  control_id: z.string().uuid("Invalid control ID"),
  status: complianceStatusSchema.default("not_started"),
  implementation_notes: z.string().max(5000, "Notes must be less than 5000 characters").nullable().optional(),
  evidence_links: z.array(evidenceLinkSchema).optional().default([]),
  target_date: z.string().nullable().optional(),
  risk_assessment: z.string().max(2000, "Risk assessment must be less than 2000 characters").nullable().optional(),
})

export const updateComplianceMappingSchema = z.object({
  status: complianceStatusSchema.optional(),
  implementation_notes: z.string().max(5000, "Notes must be less than 5000 characters").nullable().optional(),
  evidence_links: z.array(evidenceLinkSchema).optional(),
  target_date: z.string().nullable().optional(),
  risk_assessment: z.string().max(2000, "Risk assessment must be less than 2000 characters").nullable().optional(),
  change_reason: z.string().max(1000, "Change reason must be less than 1000 characters").optional(),
})

export const verifyComplianceMappingSchema = z.object({
  verification_notes: z.string().max(2000, "Verification notes must be less than 2000 characters").nullable().optional(),
})

// ============================================================================
// PROGRAM COMPLIANCE SETTINGS SCHEMA
// ============================================================================

export const programComplianceSettingsSchema = z.object({
  program_id: z.string().uuid("Invalid program ID"),
  framework_id: z.string().uuid("Invalid framework ID"),
  is_enabled: z.boolean().default(true),
  effective_date: z.string().nullable().optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").nullable().optional(),
})

// ============================================================================
// CONTROL SCHEMAS
// ============================================================================

export const complianceControlSchema = z.object({
  framework_id: z.string().uuid("Invalid framework ID"),
  control_code: z.string().min(1, "Control code is required").max(50),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  subcategory: z.string().max(100).nullable().optional(),
  requirement_type: requirementLevelSchema.nullable().optional(),
  is_critical: z.boolean().default(false),
  applicability_criteria: z.record(z.any()).nullable().optional(),
  guidance_notes: z.string().max(5000).nullable().optional(),
  evidence_requirements: z.string().max(2000).nullable().optional(),
  display_order: z.number().int().min(0).default(0),
  parent_control_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
})

// ============================================================================
// FRAMEWORK SCHEMA
// ============================================================================

export const complianceFrameworkSchema = z.object({
  code: z.string().min(1, "Code is required").max(20),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(2000).nullable().optional(),
  version: z.string().max(20).nullable().optional(),
  regulatory_body: z.string().max(100).nullable().optional(),
  effective_date: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
  metadata: z.record(z.any()).optional().default({}),
})

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const complianceMatrixFiltersSchema = z.object({
  program_id: z.string().uuid().optional(),
  framework_code: z.string().optional(),
  status: z.array(complianceStatusSchema).optional(),
  is_critical: z.boolean().optional(),
  has_gap: z.boolean().optional(),
})

export const complianceControlFiltersSchema = z.object({
  framework_id: z.string().uuid().optional(),
  category: z.string().optional(),
  is_critical: z.boolean().optional(),
  requirement_type: requirementLevelSchema.optional(),
  search: z.string().max(200).optional(),
})

export const complianceHistoryFiltersSchema = z.object({
  mapping_id: z.string().uuid().optional(),
  story_id: z.string().optional(),
  control_id: z.string().uuid().optional(),
  action: z.enum(["created", "updated", "verified", "deleted"]).optional(),
  changed_by: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
})

// ============================================================================
// REPORT PARAMS SCHEMA
// ============================================================================

export const complianceReportParamsSchema = z.object({
  program_id: z.string().uuid().optional(),
  framework_id: z.string().uuid().optional(),
  framework_code: z.string().optional(),
  include_gaps_only: z.boolean().optional(),
  include_history: z.boolean().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
})

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type CreateComplianceMappingData = z.infer<typeof createComplianceMappingSchema>
export type UpdateComplianceMappingData = z.infer<typeof updateComplianceMappingSchema>
export type VerifyComplianceMappingData = z.infer<typeof verifyComplianceMappingSchema>
export type ProgramComplianceSettingsData = z.infer<typeof programComplianceSettingsSchema>
export type ComplianceControlData = z.infer<typeof complianceControlSchema>
export type ComplianceFrameworkData = z.infer<typeof complianceFrameworkSchema>
export type ComplianceMatrixFiltersData = z.infer<typeof complianceMatrixFiltersSchema>
export type ComplianceControlFiltersData = z.infer<typeof complianceControlFiltersSchema>
export type ComplianceHistoryFiltersData = z.infer<typeof complianceHistoryFiltersSchema>
export type ComplianceReportParamsData = z.infer<typeof complianceReportParamsSchema>
