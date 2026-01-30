// ============================================================================
// Healthcare Compliance Tracking Types
// ============================================================================

import type { Json } from "./database"

// Status enum matching database
export type ComplianceStatus =
  | "not_applicable"
  | "not_started"
  | "planned"
  | "in_progress"
  | "implemented"
  | "verified"
  | "deferred"

// Requirement type for controls
export type RequirementLevel = "required" | "addressable" | "recommended"

// ============================================================================
// BASE ENTITY TYPES
// ============================================================================

export interface ComplianceFramework {
  framework_id: string
  code: string
  name: string
  description: string | null
  version: string | null
  regulatory_body: string | null
  effective_date: string | null
  is_active: boolean
  display_order: number
  metadata: Json
  created_at: string
  updated_at: string
}

export interface ComplianceControl {
  control_id: string
  framework_id: string
  control_code: string
  title: string
  description: string | null
  category: string | null
  subcategory: string | null
  requirement_type: RequirementLevel | null
  is_critical: boolean
  applicability_criteria: Json | null
  guidance_notes: string | null
  evidence_requirements: string | null
  display_order: number
  parent_control_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EvidenceLink {
  url: string
  description: string
  uploaded_at: string
}

export interface StoryComplianceMapping {
  mapping_id: string
  story_id: string
  control_id: string
  status: ComplianceStatus
  implementation_notes: string | null
  evidence_links: EvidenceLink[]
  target_date: string | null
  verified_at: string | null
  verified_by: string | null
  verification_notes: string | null
  risk_assessment: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ComplianceMappingHistory {
  history_id: string
  mapping_id: string
  story_id: string
  control_id: string
  action: "created" | "updated" | "verified" | "deleted"
  previous_status: ComplianceStatus | null
  new_status: ComplianceStatus | null
  previous_data: Json | null
  new_data: Json | null
  change_reason: string | null
  changed_by: string
  changed_by_name: string | null
  changed_by_email: string | null
  ip_address: string | null
  user_agent: string | null
  session_id: string | null
  created_at: string
}

export interface ProgramComplianceSettings {
  id: string
  program_id: string
  framework_id: string
  is_enabled: boolean
  effective_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ComplianceReport {
  report_id: string
  program_id: string | null
  framework_id: string | null
  report_type: "summary" | "detail" | "gap_analysis" | "audit_package"
  title: string
  description: string | null
  report_data: Json
  file_url: string | null
  generated_at: string
  generated_by: string
  parameters: Json | null
  is_archived: boolean
  archived_at: string | null
  archived_by: string | null
}

// ============================================================================
// EXTENDED/JOINED TYPES
// ============================================================================

// Control with framework info
export interface ComplianceControlWithFramework extends ComplianceControl {
  framework?: ComplianceFramework
  framework_code?: string
  framework_name?: string
}

// Mapping with control and framework info
export interface StoryComplianceMappingWithDetails extends StoryComplianceMapping {
  control?: ComplianceControlWithFramework
  control_code?: string
  control_title?: string
  framework_code?: string
  framework_name?: string
  verified_by_name?: string
  created_by_name?: string
}

// History with user name resolved
export interface ComplianceMappingHistoryWithNames extends ComplianceMappingHistory {
  control_code?: string
  control_title?: string
}

// ============================================================================
// SUMMARY/AGGREGATION TYPES
// ============================================================================

export interface ComplianceFrameworkSummary {
  framework_id: string
  framework_code: string
  framework_name: string
  total_controls: number
  critical_controls: number
  mapped_count: number
  verified_count: number
  implemented_count: number
  in_progress_count: number
  not_started_count: number
  deferred_count: number
  not_applicable_count: number
  completion_percentage: number
}

export interface ComplianceGapItem {
  framework_id: string
  framework_code: string
  framework_name: string
  control_id: string
  control_code: string
  control_title: string
  category: string | null
  is_critical: boolean
  requirement_type: RequirementLevel | null
  stories_count: number
  verified_count: number
  implemented_count: number
  has_gap: boolean
}

export interface ComplianceMatrixCell {
  story_id: string
  story_title: string
  program_id: string
  program_name: string | null
  story_status: string
  story_category: string | null
  framework_id: string
  framework_code: string
  framework_name: string
  control_id: string
  control_code: string
  control_title: string
  control_category: string | null
  is_critical: boolean
  mapping_id: string | null
  compliance_status: ComplianceStatus | null
  verified_at: string | null
  verified_by: string | null
  target_date: string | null
  mapping_created_at: string | null
}

export interface ComplianceDashboardStats {
  frameworks: ComplianceFrameworkSummary[]
  total_stories_with_mappings: number
  total_mappings: number
  critical_gaps: number
  recent_verifications: number
}

// ============================================================================
// AI SUGGESTION TYPES
// ============================================================================

export interface AISuggestedControl {
  control_id: string
  control_code: string
  control_title: string
  framework_code: string
  framework_name: string
  confidence_score: number
  match_reason: string
  is_critical: boolean
}

// ============================================================================
// FORM/INPUT TYPES
// ============================================================================

export interface CreateComplianceMappingInput {
  story_id: string
  control_id: string
  status?: ComplianceStatus
  implementation_notes?: string
  evidence_links?: EvidenceLink[]
  target_date?: string
  risk_assessment?: string
}

export interface UpdateComplianceMappingInput {
  status?: ComplianceStatus
  implementation_notes?: string
  evidence_links?: EvidenceLink[]
  target_date?: string
  risk_assessment?: string
  change_reason?: string
}

export interface VerifyComplianceMappingInput {
  verification_notes?: string
}

export interface ProgramComplianceSettingsInput {
  program_id: string
  framework_id: string
  is_enabled: boolean
  effective_date?: string
  notes?: string
}

// ============================================================================
// FILTER/QUERY TYPES
// ============================================================================

export interface ComplianceMatrixFilters {
  program_id?: string
  framework_code?: string
  status?: ComplianceStatus[]
  is_critical?: boolean
  has_gap?: boolean
}

export interface ComplianceControlFilters {
  framework_id?: string
  category?: string
  is_critical?: boolean
  requirement_type?: RequirementLevel
  search?: string
}

export interface ComplianceHistoryFilters {
  mapping_id?: string
  story_id?: string
  control_id?: string
  action?: string
  changed_by?: string
  date_from?: string
  date_to?: string
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface ComplianceReportParams {
  program_id?: string
  framework_id?: string
  framework_code?: string
  include_gaps_only?: boolean
  include_history?: boolean
  date_from?: string
  date_to?: string
}

export type ComplianceCSVExportType = "matrix" | "gaps" | "history" | "summary"

// ============================================================================
// DATABASE INSERT/UPDATE TYPES (for Supabase)
// ============================================================================

export interface ComplianceFrameworkInsert {
  framework_id?: string
  code: string
  name: string
  description?: string | null
  version?: string | null
  regulatory_body?: string | null
  effective_date?: string | null
  is_active?: boolean
  display_order?: number
  metadata?: Json
}

export interface ComplianceFrameworkUpdate {
  code?: string
  name?: string
  description?: string | null
  version?: string | null
  regulatory_body?: string | null
  effective_date?: string | null
  is_active?: boolean
  display_order?: number
  metadata?: Json
  updated_at?: string
}

export interface ComplianceControlInsert {
  control_id?: string
  framework_id: string
  control_code: string
  title: string
  description?: string | null
  category?: string | null
  subcategory?: string | null
  requirement_type?: RequirementLevel | null
  is_critical?: boolean
  applicability_criteria?: Json | null
  guidance_notes?: string | null
  evidence_requirements?: string | null
  display_order?: number
  parent_control_id?: string | null
  is_active?: boolean
}

export interface ComplianceControlUpdate {
  control_code?: string
  title?: string
  description?: string | null
  category?: string | null
  subcategory?: string | null
  requirement_type?: RequirementLevel | null
  is_critical?: boolean
  applicability_criteria?: Json | null
  guidance_notes?: string | null
  evidence_requirements?: string | null
  display_order?: number
  parent_control_id?: string | null
  is_active?: boolean
  updated_at?: string
}

export interface StoryComplianceMappingInsert {
  mapping_id?: string
  story_id: string
  control_id: string
  status?: ComplianceStatus
  implementation_notes?: string | null
  evidence_links?: Json
  target_date?: string | null
  verified_at?: string | null
  verified_by?: string | null
  verification_notes?: string | null
  risk_assessment?: string | null
  created_by?: string | null
}

export interface StoryComplianceMappingUpdate {
  status?: ComplianceStatus
  implementation_notes?: string | null
  evidence_links?: Json
  target_date?: string | null
  verified_at?: string | null
  verified_by?: string | null
  verification_notes?: string | null
  risk_assessment?: string | null
  updated_at?: string
}

export interface ProgramComplianceSettingsInsert {
  id?: string
  program_id: string
  framework_id: string
  is_enabled?: boolean
  effective_date?: string | null
  notes?: string | null
  created_by?: string | null
}

export interface ProgramComplianceSettingsUpdate {
  is_enabled?: boolean
  effective_date?: string | null
  notes?: string | null
  updated_at?: string
}

export interface ComplianceReportInsert {
  report_id?: string
  program_id?: string | null
  framework_id?: string | null
  report_type: string
  title: string
  description?: string | null
  report_data: Json
  file_url?: string | null
  generated_by: string
  parameters?: Json | null
}
