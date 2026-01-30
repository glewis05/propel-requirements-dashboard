"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  ComplianceFramework,
  ComplianceControl,
  ComplianceControlWithFramework,
  StoryComplianceMapping,
  StoryComplianceMappingWithDetails,
  ComplianceMappingHistory,
  ComplianceFrameworkSummary,
  ComplianceGapItem,
  ComplianceMatrixCell,
  ComplianceDashboardStats,
  AISuggestedControl,
  ProgramComplianceSettings,
  EvidenceLink,
} from "@/types/compliance"
import type { CreateComplianceMappingData, UpdateComplianceMappingData } from "@/lib/validations/compliance"
import { CSV_COLUMNS } from "@/lib/compliance/constants"

// ============================================================================
// FRAMEWORK ACTIONS
// ============================================================================

export async function getComplianceFrameworks(activeOnly = true) {
  const supabase = await createClient()

  let query = supabase
    .from("compliance_frameworks")
    .select("*")
    .order("display_order", { ascending: true })

  if (activeOnly) {
    query = query.eq("is_active", true)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching compliance frameworks:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as ComplianceFramework[] }
}

export async function getFrameworkByCode(code: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("compliance_frameworks")
    .select("*")
    .eq("code", code)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as ComplianceFramework }
}

// ============================================================================
// CONTROL ACTIONS
// ============================================================================

export async function getComplianceControls(
  frameworkId?: string,
  options?: {
    category?: string
    isCritical?: boolean
    search?: string
    activeOnly?: boolean
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from("compliance_controls")
    .select(`
      *,
      compliance_frameworks (
        framework_id,
        code,
        name
      )
    `)
    .order("display_order", { ascending: true })

  if (frameworkId) {
    query = query.eq("framework_id", frameworkId)
  }

  if (options?.category) {
    query = query.eq("category", options.category)
  }

  if (options?.isCritical !== undefined) {
    query = query.eq("is_critical", options.isCritical)
  }

  if (options?.activeOnly !== false) {
    query = query.eq("is_active", true)
  }

  if (options?.search) {
    query = query.or(`control_code.ilike.%${options.search}%,title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching compliance controls:", error)
    return { success: false, error: error.message }
  }

  // Transform to add framework info
  const controls: ComplianceControlWithFramework[] = (data || []).map((control: any) => ({
    ...control,
    framework: control.compliance_frameworks,
    framework_code: control.compliance_frameworks?.code,
    framework_name: control.compliance_frameworks?.name,
    compliance_frameworks: undefined,
  }))

  return { success: true, data: controls }
}

export async function getControlById(controlId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("compliance_controls")
    .select(`
      *,
      compliance_frameworks (
        framework_id,
        code,
        name,
        regulatory_body
      )
    `)
    .eq("control_id", controlId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  const control: ComplianceControlWithFramework = {
    ...data,
    framework: data.compliance_frameworks,
    framework_code: data.compliance_frameworks?.code,
    framework_name: data.compliance_frameworks?.name,
  }

  return { success: true, data: control }
}

export async function getControlCategories(frameworkId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("compliance_controls")
    .select("category")
    .eq("is_active", true)
    .not("category", "is", null)

  if (frameworkId) {
    query = query.eq("framework_id", frameworkId)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  // Get unique categories
  const categories = [...new Set((data || []).map(d => d.category).filter(Boolean))]

  return { success: true, data: categories as string[] }
}

// ============================================================================
// MAPPING ACTIONS
// ============================================================================

export async function getStoryComplianceMappings(storyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("story_compliance_mappings")
    .select(`
      *,
      compliance_controls (
        control_id,
        control_code,
        title,
        category,
        is_critical,
        framework_id,
        compliance_frameworks (
          framework_id,
          code,
          name
        )
      )
    `)
    .eq("story_id", storyId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching story compliance mappings:", error)
    return { success: false, error: error.message }
  }

  // Get verifier names
  const verifierIds = (data || [])
    .filter((m: any) => m.verified_by)
    .map((m: any) => m.verified_by)

  let verifierNames: Record<string, string> = {}
  if (verifierIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("user_id, name")
      .in("user_id", verifierIds)

    verifierNames = (users || []).reduce((acc: Record<string, string>, u: any) => {
      acc[u.user_id] = u.name
      return acc
    }, {})
  }

  // Transform data
  const mappings: StoryComplianceMappingWithDetails[] = (data || []).map((m: any) => ({
    ...m,
    evidence_links: m.evidence_links || [],
    control: m.compliance_controls,
    control_code: m.compliance_controls?.control_code,
    control_title: m.compliance_controls?.title,
    framework_code: m.compliance_controls?.compliance_frameworks?.code,
    framework_name: m.compliance_controls?.compliance_frameworks?.name,
    verified_by_name: m.verified_by ? verifierNames[m.verified_by] : null,
    compliance_controls: undefined,
  }))

  return { success: true, data: mappings }
}

export async function createComplianceMapping(data: CreateComplianceMappingData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user details
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  // Check permissions
  if (!["Admin", "Portfolio Manager", "Program Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to create compliance mappings" }
  }

  // Check for existing mapping
  const { data: existing } = await supabase
    .from("story_compliance_mappings")
    .select("mapping_id")
    .eq("story_id", data.story_id)
    .eq("control_id", data.control_id)
    .single()

  if (existing) {
    return { success: false, error: "This control is already mapped to this story" }
  }

  // Create mapping
  const { data: mapping, error } = await supabase
    .from("story_compliance_mappings")
    .insert({
      story_id: data.story_id,
      control_id: data.control_id,
      status: data.status || "not_started",
      implementation_notes: data.implementation_notes || null,
      evidence_links: data.evidence_links || [],
      target_date: data.target_date || null,
      risk_assessment: data.risk_assessment || null,
      created_by: userData.user_id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating compliance mapping:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stories/${data.story_id}`)
  revalidatePath("/compliance")
  revalidatePath("/compliance/matrix")

  return { success: true, data: mapping as StoryComplianceMapping }
}

export async function updateComplianceMapping(
  mappingId: string,
  data: UpdateComplianceMappingData
) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user details
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  // Check permissions
  if (!["Admin", "Portfolio Manager", "Program Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to update compliance mappings" }
  }

  // Get current mapping for story_id (for revalidation)
  const { data: currentMapping } = await supabase
    .from("story_compliance_mappings")
    .select("story_id")
    .eq("mapping_id", mappingId)
    .single()

  if (!currentMapping) {
    return { success: false, error: "Mapping not found" }
  }

  // Update mapping
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (data.status !== undefined) updateData.status = data.status
  if (data.implementation_notes !== undefined) updateData.implementation_notes = data.implementation_notes
  if (data.evidence_links !== undefined) updateData.evidence_links = data.evidence_links
  if (data.target_date !== undefined) updateData.target_date = data.target_date
  if (data.risk_assessment !== undefined) updateData.risk_assessment = data.risk_assessment

  const { data: updated, error } = await supabase
    .from("story_compliance_mappings")
    .update(updateData)
    .eq("mapping_id", mappingId)
    .select()
    .single()

  if (error) {
    console.error("Error updating compliance mapping:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stories/${currentMapping.story_id}`)
  revalidatePath("/compliance")
  revalidatePath("/compliance/matrix")

  return { success: true, data: updated as StoryComplianceMapping }
}

export async function verifyComplianceMapping(mappingId: string, verificationNotes?: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user details
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  // Only Admin and Portfolio Manager can verify
  if (!["Admin", "Portfolio Manager"].includes(userData.role || "")) {
    return { success: false, error: "Only Admin or Portfolio Manager can verify compliance mappings" }
  }

  // Get current mapping
  const { data: currentMapping } = await supabase
    .from("story_compliance_mappings")
    .select("story_id, status")
    .eq("mapping_id", mappingId)
    .single()

  if (!currentMapping) {
    return { success: false, error: "Mapping not found" }
  }

  // Must be implemented to verify
  if (currentMapping.status !== "implemented") {
    return { success: false, error: "Mapping must be in 'Implemented' status to verify" }
  }

  // Update mapping
  const { data: updated, error } = await supabase
    .from("story_compliance_mappings")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
      verified_by: userData.user_id,
      verification_notes: verificationNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("mapping_id", mappingId)
    .select()
    .single()

  if (error) {
    console.error("Error verifying compliance mapping:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stories/${currentMapping.story_id}`)
  revalidatePath("/compliance")
  revalidatePath("/compliance/matrix")

  return { success: true, data: updated as StoryComplianceMapping }
}

export async function deleteComplianceMapping(mappingId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user details
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  // Only Admin and Portfolio Manager can delete
  if (!["Admin", "Portfolio Manager"].includes(userData.role || "")) {
    return { success: false, error: "Only Admin or Portfolio Manager can delete compliance mappings" }
  }

  // Get current mapping for revalidation
  const { data: currentMapping } = await supabase
    .from("story_compliance_mappings")
    .select("story_id")
    .eq("mapping_id", mappingId)
    .single()

  if (!currentMapping) {
    return { success: false, error: "Mapping not found" }
  }

  // Delete mapping (trigger will log to history)
  const { error } = await supabase
    .from("story_compliance_mappings")
    .delete()
    .eq("mapping_id", mappingId)

  if (error) {
    console.error("Error deleting compliance mapping:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stories/${currentMapping.story_id}`)
  revalidatePath("/compliance")
  revalidatePath("/compliance/matrix")

  return { success: true }
}

// ============================================================================
// SUMMARY & DASHBOARD ACTIONS
// ============================================================================

export async function getComplianceSummary(programId?: string) {
  const supabase = await createClient()

  // Get framework summaries
  const { data: frameworks, error: fwError } = await supabase
    .from("compliance_summary_by_framework")
    .select("*")

  if (fwError) {
    console.error("Error fetching compliance summary:", fwError)
    // Fallback to manual calculation
    return getComplianceSummaryFallback(programId)
  }

  // Calculate additional stats
  const { data: mappingStats } = await supabase
    .from("story_compliance_mappings")
    .select("story_id, status, verified_at")

  const uniqueStories = new Set((mappingStats || []).map(m => m.story_id))
  const recentVerifications = (mappingStats || []).filter(m => {
    if (!m.verified_at) return false
    const verifiedDate = new Date(m.verified_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return verifiedDate > sevenDaysAgo
  }).length

  // Get critical gaps
  const { data: gaps } = await supabase
    .from("compliance_gap_analysis")
    .select("*")
    .eq("is_critical", true)
    .eq("has_gap", true)

  const stats: ComplianceDashboardStats = {
    frameworks: (frameworks || []).map((f: any) => ({
      framework_id: f.framework_id,
      framework_code: f.framework_code,
      framework_name: f.framework_name,
      total_controls: f.total_controls || 0,
      critical_controls: f.critical_controls || 0,
      mapped_count: f.mapped_count || 0,
      verified_count: f.verified_count || 0,
      implemented_count: f.implemented_count || 0,
      in_progress_count: f.in_progress_count || 0,
      not_started_count: f.not_started_count || 0,
      deferred_count: f.deferred_count || 0,
      not_applicable_count: f.not_applicable_count || 0,
      completion_percentage: f.total_controls > 0
        ? Math.round(((f.verified_count || 0) + (f.implemented_count || 0)) / f.total_controls * 100)
        : 0,
    })),
    total_stories_with_mappings: uniqueStories.size,
    total_mappings: (mappingStats || []).length,
    critical_gaps: (gaps || []).length,
    recent_verifications: recentVerifications,
  }

  return { success: true, data: stats }
}

async function getComplianceSummaryFallback(programId?: string) {
  const supabase = await createClient()

  // Get frameworks
  const { data: frameworks } = await supabase
    .from("compliance_frameworks")
    .select("framework_id, code, name")
    .eq("is_active", true)

  // Get controls count by framework
  const { data: controls } = await supabase
    .from("compliance_controls")
    .select("framework_id, is_critical")
    .eq("is_active", true)

  // Get mappings
  const { data: mappings } = await supabase
    .from("story_compliance_mappings")
    .select("control_id, status, verified_at, compliance_controls(framework_id)")

  // Aggregate
  const summaries: ComplianceFrameworkSummary[] = (frameworks || []).map((fw: any) => {
    const fwControls = (controls || []).filter((c: any) => c.framework_id === fw.framework_id)
    const fwMappings = (mappings || []).filter((m: any) =>
      m.compliance_controls?.framework_id === fw.framework_id
    )

    return {
      framework_id: fw.framework_id,
      framework_code: fw.code,
      framework_name: fw.name,
      total_controls: fwControls.length,
      critical_controls: fwControls.filter((c: any) => c.is_critical).length,
      mapped_count: fwMappings.length,
      verified_count: fwMappings.filter((m: any) => m.status === "verified").length,
      implemented_count: fwMappings.filter((m: any) => m.status === "implemented").length,
      in_progress_count: fwMappings.filter((m: any) => m.status === "in_progress").length,
      not_started_count: fwMappings.filter((m: any) => m.status === "not_started").length,
      deferred_count: fwMappings.filter((m: any) => m.status === "deferred").length,
      not_applicable_count: fwMappings.filter((m: any) => m.status === "not_applicable").length,
      completion_percentage: fwControls.length > 0
        ? Math.round(fwMappings.filter((m: any) => ["verified", "implemented"].includes(m.status)).length / fwControls.length * 100)
        : 0,
    }
  })

  const uniqueStories = new Set((mappings || []).map((m: any) => m.story_id))

  return {
    success: true,
    data: {
      frameworks: summaries,
      total_stories_with_mappings: uniqueStories.size,
      total_mappings: (mappings || []).length,
      critical_gaps: 0, // Would need additional query
      recent_verifications: 0,
    } as ComplianceDashboardStats
  }
}

// ============================================================================
// MATRIX & GAP ANALYSIS ACTIONS
// ============================================================================

export async function getComplianceMatrix(
  options?: {
    programId?: string
    frameworkCode?: string
    limit?: number
    offset?: number
  }
) {
  const supabase = await createClient()

  // Build query for matrix data
  let query = supabase
    .from("story_compliance_mappings")
    .select(`
      *,
      user_stories!inner (
        story_id,
        title,
        program_id,
        status,
        category,
        programs (
          program_id,
          name
        )
      ),
      compliance_controls!inner (
        control_id,
        control_code,
        title,
        category,
        is_critical,
        compliance_frameworks!inner (
          framework_id,
          code,
          name
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching compliance matrix:", error)
    return { success: false, error: error.message }
  }

  // Filter by program/framework if needed
  let filteredData = data || []

  if (options?.programId) {
    filteredData = filteredData.filter((d: any) =>
      d.user_stories?.program_id === options.programId
    )
  }

  if (options?.frameworkCode) {
    filteredData = filteredData.filter((d: any) =>
      d.compliance_controls?.compliance_frameworks?.code === options.frameworkCode
    )
  }

  // Transform to matrix cells
  const cells: ComplianceMatrixCell[] = filteredData.map((d: any) => ({
    story_id: d.story_id,
    story_title: d.user_stories?.title,
    program_id: d.user_stories?.program_id,
    program_name: d.user_stories?.programs?.name,
    story_status: d.user_stories?.status,
    story_category: d.user_stories?.category,
    framework_id: d.compliance_controls?.compliance_frameworks?.framework_id,
    framework_code: d.compliance_controls?.compliance_frameworks?.code,
    framework_name: d.compliance_controls?.compliance_frameworks?.name,
    control_id: d.control_id,
    control_code: d.compliance_controls?.control_code,
    control_title: d.compliance_controls?.title,
    control_category: d.compliance_controls?.category,
    is_critical: d.compliance_controls?.is_critical,
    mapping_id: d.mapping_id,
    compliance_status: d.status,
    verified_at: d.verified_at,
    verified_by: d.verified_by,
    target_date: d.target_date,
    mapping_created_at: d.created_at,
  }))

  return { success: true, data: cells }
}

export async function getComplianceGaps(
  options?: {
    programId?: string
    frameworkCode?: string
    criticalOnly?: boolean
  }
) {
  const supabase = await createClient()

  // Try to use the view first
  let query = supabase
    .from("compliance_gap_analysis")
    .select("*")
    .order("framework_code")
    .order("control_code")

  if (options?.criticalOnly) {
    query = query.eq("is_critical", true)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching gap analysis:", error)
    return { success: false, error: error.message }
  }

  let gaps: ComplianceGapItem[] = (data || []).map((d: any) => ({
    framework_id: d.framework_id,
    framework_code: d.framework_code,
    framework_name: d.framework_name,
    control_id: d.control_id,
    control_code: d.control_code,
    control_title: d.control_title,
    category: d.category,
    is_critical: d.is_critical,
    requirement_type: d.requirement_type,
    stories_count: d.stories_count || 0,
    verified_count: d.verified_count || 0,
    implemented_count: d.implemented_count || 0,
    has_gap: d.has_gap,
  }))

  // Filter by framework if specified
  if (options?.frameworkCode) {
    gaps = gaps.filter(g => g.framework_code === options.frameworkCode)
  }

  return { success: true, data: gaps }
}

// ============================================================================
// HISTORY ACTIONS
// ============================================================================

export async function getMappingHistory(
  options?: {
    mappingId?: string
    storyId?: string
    controlId?: string
    limit?: number
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from("compliance_mapping_history")
    .select("*")
    .order("created_at", { ascending: false })

  if (options?.mappingId) {
    query = query.eq("mapping_id", options.mappingId)
  }

  if (options?.storyId) {
    query = query.eq("story_id", options.storyId)
  }

  if (options?.controlId) {
    query = query.eq("control_id", options.controlId)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching mapping history:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as ComplianceMappingHistory[] }
}

// ============================================================================
// AI SUGGESTIONS
// ============================================================================

export async function getAISuggestedControls(
  storyId: string,
  options?: {
    frameworkCode?: string
    limit?: number
  }
) {
  const supabase = await createClient()

  // Get story details
  const { data: story, error: storyError } = await supabase
    .from("user_stories")
    .select("story_id, title, category, user_story, acceptance_criteria")
    .eq("story_id", storyId)
    .single()

  if (storyError || !story) {
    return { success: false, error: "Story not found" }
  }

  // Get controls with applicability criteria
  let query = supabase
    .from("compliance_controls")
    .select(`
      control_id,
      control_code,
      title,
      is_critical,
      applicability_criteria,
      compliance_frameworks (
        code,
        name
      )
    `)
    .eq("is_active", true)
    .not("applicability_criteria", "is", null)

  const { data: controls, error: controlsError } = await query

  if (controlsError) {
    return { success: false, error: controlsError.message }
  }

  // Get existing mappings for this story
  const { data: existingMappings } = await supabase
    .from("story_compliance_mappings")
    .select("control_id")
    .eq("story_id", storyId)

  const mappedControlIds = new Set((existingMappings || []).map(m => m.control_id))

  // Score controls based on category and keyword matching
  const storyText = [
    story.title,
    story.category,
    story.user_story,
    story.acceptance_criteria,
  ].filter(Boolean).join(" ").toLowerCase()

  const suggestions: AISuggestedControl[] = []

  for (const control of controls || []) {
    // Skip already mapped controls
    if (mappedControlIds.has(control.control_id)) continue

    // Filter by framework if specified
    if (options?.frameworkCode && control.compliance_frameworks?.code !== options.frameworkCode) {
      continue
    }

    const criteria = control.applicability_criteria as { categories?: string[], keywords?: string[] } | null
    if (!criteria) continue

    let score = 0
    let matchReasons: string[] = []

    // Category matching
    if (criteria.categories && story.category) {
      const storyCategory = story.category.toLowerCase()
      for (const cat of criteria.categories) {
        if (storyCategory.includes(cat.toLowerCase())) {
          score += 0.4
          matchReasons.push(`Category: ${cat}`)
          break
        }
      }
    }

    // Keyword matching
    if (criteria.keywords) {
      let keywordMatches = 0
      for (const keyword of criteria.keywords) {
        if (storyText.includes(keyword.toLowerCase())) {
          keywordMatches++
          if (matchReasons.length < 3) {
            matchReasons.push(`Keyword: ${keyword}`)
          }
        }
      }
      // More keywords = higher score
      score += Math.min(keywordMatches * 0.15, 0.6)
    }

    // Critical controls get a boost
    if (control.is_critical && score > 0) {
      score += 0.1
    }

    if (score >= 0.3) {
      suggestions.push({
        control_id: control.control_id,
        control_code: control.control_code,
        control_title: control.title,
        framework_code: control.compliance_frameworks?.code || "",
        framework_name: control.compliance_frameworks?.name || "",
        confidence_score: Math.min(score, 1),
        match_reason: matchReasons.join(", "),
        is_critical: control.is_critical,
      })
    }
  }

  // Sort by confidence score
  suggestions.sort((a, b) => b.confidence_score - a.confidence_score)

  // Limit results
  const limit = options?.limit || 10
  return { success: true, data: suggestions.slice(0, limit) }
}

// ============================================================================
// PROGRAM SETTINGS
// ============================================================================

export async function getProgramComplianceSettings(programId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("program_compliance_settings")
    .select(`
      *,
      compliance_frameworks (
        framework_id,
        code,
        name
      )
    `)
    .eq("program_id", programId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as (ProgramComplianceSettings & { compliance_frameworks: ComplianceFramework })[] }
}

export async function updateProgramComplianceSettings(
  programId: string,
  frameworkId: string,
  isEnabled: boolean,
  notes?: string
) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user details
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData || !["Admin", "Portfolio Manager", "Program Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to update compliance settings" }
  }

  // Upsert setting
  const { data, error } = await supabase
    .from("program_compliance_settings")
    .upsert({
      program_id: programId,
      framework_id: frameworkId,
      is_enabled: isEnabled,
      notes: notes || null,
      created_by: userData.user_id,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "program_id,framework_id",
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/compliance/settings`)

  return { success: true, data }
}

// ============================================================================
// CSV EXPORT
// ============================================================================

export async function exportComplianceCSV(
  type: "matrix" | "gaps" | "history" | "summary",
  options?: {
    programId?: string
    frameworkCode?: string
    dateFrom?: string
    dateTo?: string
  }
) {
  const supabase = await createClient()

  let rows: string[][] = []
  const columns = CSV_COLUMNS[type]

  switch (type) {
    case "matrix": {
      const result = await getComplianceMatrix({
        programId: options?.programId,
        frameworkCode: options?.frameworkCode,
        limit: 10000,
      })
      if (!result.success) return result

      rows = (result.data || []).map(cell => [
        cell.story_id,
        cell.story_title,
        cell.program_name || "",
        cell.story_status,
        cell.framework_code,
        cell.control_code,
        cell.control_title,
        cell.is_critical ? "Yes" : "No",
        cell.compliance_status || "",
        cell.target_date || "",
        cell.verified_at || "",
        cell.verified_by || "",
      ])
      break
    }

    case "gaps": {
      const result = await getComplianceGaps({
        frameworkCode: options?.frameworkCode,
      })
      if (!result.success) return result

      rows = (result.data || []).filter(g => g.has_gap).map(gap => [
        gap.framework_code,
        gap.control_code,
        gap.control_title,
        gap.category || "",
        gap.is_critical ? "Yes" : "No",
        gap.requirement_type || "",
        String(gap.stories_count),
        String(gap.verified_count),
        String(gap.implemented_count),
        gap.has_gap ? "Yes" : "No",
      ])
      break
    }

    case "history": {
      const result = await getMappingHistory({ limit: 10000 })
      if (!result.success) return result

      rows = (result.data || []).map(h => [
        h.created_at,
        h.story_id,
        h.control_id,
        h.action,
        h.previous_status || "",
        h.new_status || "",
        h.changed_by_name || "",
        h.changed_by_email || "",
        h.change_reason || "",
        h.ip_address || "",
      ])
      break
    }

    case "summary": {
      const result = await getComplianceSummary(options?.programId)
      if (!result.success) return result

      rows = (result.data?.frameworks || []).map(fw => [
        fw.framework_name,
        String(fw.total_controls),
        String(fw.critical_controls),
        String(fw.mapped_count),
        String(fw.verified_count),
        String(fw.implemented_count),
        String(fw.in_progress_count),
        String(fw.completion_percentage),
      ])
      break
    }
  }

  // Generate CSV content
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const csvContent = [
    columns.map(escape).join(","),
    ...rows.map(row => row.map(escape).join(",")),
  ].join("\n")

  return { success: true, data: csvContent }
}
