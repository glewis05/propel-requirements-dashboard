// ============================================================================
// Healthcare Compliance Constants
// ============================================================================

import type { ComplianceStatus, RequirementLevel } from "@/types/compliance"

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

export interface StatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  description: string
  order: number
}

export const COMPLIANCE_STATUS_CONFIG: Record<ComplianceStatus, StatusConfig> = {
  not_applicable: {
    label: "Not Applicable",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    description: "This control does not apply to this story",
    order: 0,
  },
  not_started: {
    label: "Not Started",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    description: "Implementation has not begun",
    order: 1,
  },
  planned: {
    label: "Planned",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    description: "Implementation is planned but not started",
    order: 2,
  },
  in_progress: {
    label: "In Progress",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    description: "Implementation is underway",
    order: 3,
  },
  implemented: {
    label: "Implemented",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    description: "Control has been implemented, pending verification",
    order: 4,
  },
  verified: {
    label: "Verified",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-400",
    description: "Control implementation has been verified",
    order: 5,
  },
  deferred: {
    label: "Deferred",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    description: "Implementation has been deferred to a later date",
    order: 6,
  },
}

export const COMPLIANCE_STATUSES: ComplianceStatus[] = [
  "not_applicable",
  "not_started",
  "planned",
  "in_progress",
  "implemented",
  "verified",
  "deferred",
]

// ============================================================================
// REQUIREMENT LEVEL CONFIGURATION
// ============================================================================

export interface RequirementLevelConfig {
  label: string
  color: string
  bgColor: string
  description: string
}

export const REQUIREMENT_LEVEL_CONFIG: Record<RequirementLevel, RequirementLevelConfig> = {
  required: {
    label: "Required",
    color: "text-red-600",
    bgColor: "bg-red-50",
    description: "This control must be implemented",
  },
  addressable: {
    label: "Addressable",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    description: "Implementation or documented alternative required",
  },
  recommended: {
    label: "Recommended",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Best practice, not mandatory",
  },
}

export const REQUIREMENT_LEVELS: RequirementLevel[] = [
  "required",
  "addressable",
  "recommended",
]

// ============================================================================
// FRAMEWORK CONFIGURATION
// ============================================================================

export interface FrameworkConfig {
  code: string
  name: string
  shortName: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  description: string
}

export const FRAMEWORK_CONFIG: Record<string, FrameworkConfig> = {
  CFR11: {
    code: "CFR11",
    name: "21 CFR Part 11",
    shortName: "Part 11",
    icon: "FileCheck",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    description: "FDA Electronic Records & Signatures",
  },
  HIPAA: {
    code: "HIPAA",
    name: "HIPAA Security Rule",
    shortName: "HIPAA",
    icon: "Shield",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    description: "Health Information Privacy & Security",
  },
  HITRUST: {
    code: "HITRUST",
    name: "HITRUST CSF",
    shortName: "HITRUST",
    icon: "ShieldCheck",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-300",
    description: "Healthcare Information Trust Framework",
  },
  SOC2: {
    code: "SOC2",
    name: "SOC 2 Type II",
    shortName: "SOC 2",
    icon: "Award",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300",
    description: "Service Organization Controls",
  },
}

export const FRAMEWORK_CODES = Object.keys(FRAMEWORK_CONFIG)

// ============================================================================
// CATEGORY CONFIGURATION (for controls)
// ============================================================================

export const CONTROL_CATEGORIES = {
  CFR11: [
    "Electronic Records",
    "Electronic Signatures",
    "Controls for ID Codes/Passwords",
  ],
  HIPAA: [
    "Administrative Safeguards",
    "Physical Safeguards",
    "Technical Safeguards",
    "Organizational Requirements",
    "Policies and Procedures",
  ],
  HITRUST: [
    "Information Protection Program",
    "Endpoint Protection",
    "Network Security",
    "Data Protection",
    "Security Management",
  ],
  SOC2: [
    "Security",
    "Availability",
    "Processing Integrity",
    "Confidentiality",
    "Privacy",
  ],
}

// ============================================================================
// HISTORY ACTION CONFIGURATION
// ============================================================================

export interface HistoryActionConfig {
  label: string
  color: string
  icon: string
}

export const HISTORY_ACTION_CONFIG: Record<string, HistoryActionConfig> = {
  created: {
    label: "Created",
    color: "text-green-600",
    icon: "Plus",
  },
  updated: {
    label: "Updated",
    color: "text-blue-600",
    icon: "Pencil",
  },
  verified: {
    label: "Verified",
    color: "text-purple-600",
    icon: "CheckCircle",
  },
  deleted: {
    label: "Deleted",
    color: "text-red-600",
    icon: "Trash2",
  },
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface ReportTypeConfig {
  type: string
  label: string
  description: string
  icon: string
}

export const REPORT_TYPES: ReportTypeConfig[] = [
  {
    type: "summary",
    label: "Compliance Summary",
    description: "High-level overview of compliance status across frameworks",
    icon: "BarChart3",
  },
  {
    type: "detail",
    label: "Detailed Compliance Report",
    description: "Comprehensive report with all controls and their status",
    icon: "FileText",
  },
  {
    type: "gap_analysis",
    label: "Gap Analysis",
    description: "Controls that need implementation or verification",
    icon: "AlertTriangle",
  },
  {
    type: "audit_package",
    label: "Audit Package",
    description: "Complete package for auditor review including history",
    icon: "Package",
  },
]

// ============================================================================
// CSV EXPORT COLUMNS
// ============================================================================

export const CSV_COLUMNS = {
  matrix: [
    "Story ID",
    "Story Title",
    "Program",
    "Story Status",
    "Framework",
    "Control Code",
    "Control Title",
    "Is Critical",
    "Compliance Status",
    "Target Date",
    "Verified At",
    "Verified By",
  ],
  gaps: [
    "Framework",
    "Control Code",
    "Control Title",
    "Category",
    "Is Critical",
    "Requirement Type",
    "Stories Count",
    "Verified Count",
    "Implemented Count",
    "Has Gap",
  ],
  history: [
    "Timestamp",
    "Story ID",
    "Control Code",
    "Action",
    "Previous Status",
    "New Status",
    "Changed By",
    "Changed By Email",
    "Change Reason",
    "IP Address",
  ],
  summary: [
    "Framework",
    "Total Controls",
    "Critical Controls",
    "Mapped Count",
    "Verified Count",
    "Implemented Count",
    "In Progress Count",
    "Completion %",
  ],
}

// ============================================================================
// ROLE PERMISSIONS
// ============================================================================

export const COMPLIANCE_PERMISSIONS = {
  // Who can view compliance data
  view: ["Portfolio Manager", "Program Manager", "Developer", "Admin"],
  // Who can create/update mappings
  edit: ["Portfolio Manager", "Program Manager", "Admin"],
  // Who can verify mappings
  verify: ["Portfolio Manager", "Admin"],
  // Who can delete mappings
  delete: ["Portfolio Manager", "Admin"],
  // Who can manage framework settings
  admin: ["Admin"],
  // Who can generate reports
  report: ["Portfolio Manager", "Program Manager", "Admin"],
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getStatusConfig(status: ComplianceStatus): StatusConfig {
  return COMPLIANCE_STATUS_CONFIG[status] || COMPLIANCE_STATUS_CONFIG.not_started
}

export function getFrameworkConfig(code: string): FrameworkConfig | undefined {
  return FRAMEWORK_CONFIG[code]
}

export function getRequirementLevelConfig(level: RequirementLevel): RequirementLevelConfig {
  return REQUIREMENT_LEVEL_CONFIG[level] || REQUIREMENT_LEVEL_CONFIG.required
}

export function isCompletionStatus(status: ComplianceStatus): boolean {
  return status === "implemented" || status === "verified"
}

export function getStatusLabel(status: ComplianceStatus): string {
  return COMPLIANCE_STATUS_CONFIG[status]?.label || status
}

export function getFrameworkShortName(code: string): string {
  return FRAMEWORK_CONFIG[code]?.shortName || code
}
