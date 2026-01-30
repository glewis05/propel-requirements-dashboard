"use server"

import { createClient } from "@/lib/supabase/server"
import type { StoryStatus, RequirementStatus, RequirementCategory } from "@/types/database"

// ============================================
// TYPES
// ============================================

export interface ProgramSummary {
  program_id: string
  program_name: string
  total_stories: number
  by_status: Record<StoryStatus, number>
  by_priority: Record<string, number>
  approved_count: number
  approval_rate: number
}

export interface RequirementCoverageSummary {
  program_id: string
  program_name: string
  total_requirements: number
  covered_requirements: number
  uncovered_requirements: number
  uncovered_critical: number
  coverage_percentage: number
}

export interface TraceabilityItem {
  requirement_uuid: string
  requirement_id: string
  dis_number: string | null
  requirement_title: string
  requirement_category: RequirementCategory | null
  requirement_priority: string | null
  requirement_status: RequirementStatus
  program_id: string
  program_name: string
  story_id: string | null
  story_title: string | null
  story_status: StoryStatus | null
  story_priority: string | null
  coverage_type: string | null
  coverage_notes: string | null
  coverage_status: string
}

export interface StoryCoverageItem {
  story_id: string
  title: string
  program_id: string
  program_name: string
  status: StoryStatus
  priority: string | null
  has_requirement: boolean
  linked_requirement_id: string | null
}

export interface StatusTransitionReport {
  story_id: string
  title: string
  program_name: string
  from_status: string
  to_status: string
  changed_by: string
  changed_at: string
  notes: string | null
}

// ============================================
// PROGRAM SUMMARY REPORT
// ============================================

export async function getProgramSummaryReport(): Promise<{
  success: boolean
  data?: ProgramSummary[]
  error?: string
}> {
  const supabase = await createClient()

  // Get all stories grouped by program (exclude soft-deleted)
  const { data: stories, error } = await supabase
    .from("user_stories")
    .select(`
      story_id,
      program_id,
      status,
      priority,
      stakeholder_approved_at
    `)
    .is("deleted_at", null) as { data: Array<{
      story_id: string
      program_id: string
      status: StoryStatus
      priority: string | null
      stakeholder_approved_at: string | null
    }> | null; error: Error | null }

  if (error) {
    console.error("Error fetching stories:", error)
    return { success: false, error: error.message }
  }

  // Get programs
  const { data: programs } = await supabase
    .from("programs")
    .select("program_id, name")
    .eq("status", "Active") as { data: Array<{ program_id: string; name: string }> | null; error: Error | null }

  const programMap = new Map(programs?.map(p => [p.program_id, p.name]) || [])

  // Aggregate by program
  const summaryMap = new Map<string, ProgramSummary>()

  const statuses: StoryStatus[] = [
    "Draft", "Internal Review", "Pending Client Review", "Approved",
    "In Development", "In UAT", "Needs Discussion", "Out of Scope"
  ]

  stories?.forEach(story => {
    if (!summaryMap.has(story.program_id)) {
      summaryMap.set(story.program_id, {
        program_id: story.program_id,
        program_name: programMap.get(story.program_id) || story.program_id,
        total_stories: 0,
        by_status: Object.fromEntries(statuses.map(s => [s, 0])) as Record<StoryStatus, number>,
        by_priority: { "Must Have": 0, "Should Have": 0, "Could Have": 0, "Would Have": 0 },
        approved_count: 0,
        approval_rate: 0,
      })
    }

    const summary = summaryMap.get(story.program_id)!
    summary.total_stories++
    summary.by_status[story.status]++
    if (story.priority) {
      summary.by_priority[story.priority] = (summary.by_priority[story.priority] || 0) + 1
    }
    if (story.stakeholder_approved_at) {
      summary.approved_count++
    }
  })

  // Calculate approval rates
  summaryMap.forEach(summary => {
    summary.approval_rate = summary.total_stories > 0
      ? Math.round((summary.approved_count / summary.total_stories) * 100)
      : 0
  })

  return {
    success: true,
    data: Array.from(summaryMap.values()).sort((a, b) => a.program_name.localeCompare(b.program_name))
  }
}

// ============================================
// REQUIREMENT COVERAGE REPORT
// ============================================

export async function getRequirementCoverageReport(): Promise<{
  success: boolean
  data?: RequirementCoverageSummary[]
  error?: string
}> {
  const supabase = await createClient()

  // Try to use the view if it exists, otherwise calculate manually
  const { data, error } = await supabase
    .from("requirement_coverage_summary")
    .select("*") as { data: RequirementCoverageSummary[] | null; error: Error | null }

  if (error) {
    // View might not exist yet, return empty data
    console.warn("requirement_coverage_summary view not available:", error.message)
    return { success: true, data: [] }
  }

  return { success: true, data: data || [] }
}

// ============================================
// TRACEABILITY MATRIX REPORT
// ============================================

export async function getTraceabilityMatrix(programId?: string): Promise<{
  success: boolean
  data?: TraceabilityItem[]
  error?: string
}> {
  const supabase = await createClient()

  // Try to use the view
  let query = supabase.from("traceability_matrix").select("*")

  if (programId) {
    query = query.eq("program_id", programId)
  }

  const { data, error } = await query as { data: TraceabilityItem[] | null; error: Error | null }

  if (error) {
    console.warn("traceability_matrix view not available:", error.message)
    return { success: true, data: [] }
  }

  return { success: true, data: data || [] }
}

// ============================================
// STORY COVERAGE REPORT (Stories without requirements)
// ============================================

export async function getStoryCoverageReport(programId?: string): Promise<{
  success: boolean
  data?: StoryCoverageItem[]
  error?: string
}> {
  const supabase = await createClient()

  // Try to use the view
  let query = supabase.from("story_coverage").select("*")

  if (programId) {
    query = query.eq("program_id", programId)
  }

  const { data, error } = await query as { data: StoryCoverageItem[] | null; error: Error | null }

  if (error) {
    // Fall back to manual query
    console.warn("story_coverage view not available, using fallback:", error.message)

    let fallbackQuery = supabase
      .from("user_stories")
      .select(`
        story_id,
        title,
        program_id,
        status,
        priority,
        requirement_id
      `)
      .is("deleted_at", null)

    if (programId) {
      fallbackQuery = fallbackQuery.eq("program_id", programId)
    }

    const { data: stories, error: fallbackError } = await fallbackQuery as {
      data: Array<{
        story_id: string
        title: string
        program_id: string
        status: StoryStatus
        priority: string | null
        requirement_id: string | null
      }> | null
      error: Error | null
    }

    if (fallbackError) {
      return { success: false, error: fallbackError.message }
    }

    // Get programs for names
    const { data: programs } = await supabase
      .from("programs")
      .select("program_id, name") as { data: Array<{ program_id: string; name: string }> | null; error: Error | null }

    const programMap = new Map(programs?.map(p => [p.program_id, p.name]) || [])

    const coverageData: StoryCoverageItem[] = (stories || []).map(s => ({
      story_id: s.story_id,
      title: s.title,
      program_id: s.program_id,
      program_name: programMap.get(s.program_id) || s.program_id,
      status: s.status,
      priority: s.priority,
      has_requirement: !!s.requirement_id,
      linked_requirement_id: s.requirement_id,
    }))

    return { success: true, data: coverageData }
  }

  return { success: true, data: data || [] }
}

// ============================================
// STATUS TRANSITIONS REPORT (Approval History)
// ============================================

export async function getStatusTransitionsReport(
  startDate?: string,
  endDate?: string,
  programId?: string
): Promise<{
  success: boolean
  data?: StatusTransitionReport[]
  error?: string
}> {
  const supabase = await createClient()

  let query = supabase
    .from("story_approvals")
    .select(`
      id,
      story_id,
      approved_by,
      previous_status,
      status,
      notes,
      approved_at
    `)
    .order("approved_at", { ascending: false })
    .limit(500)

  if (startDate) {
    query = query.gte("approved_at", startDate)
  }
  if (endDate) {
    query = query.lte("approved_at", endDate)
  }

  const { data: approvals, error } = await query as {
    data: Array<{
      id: string
      story_id: string
      approved_by: string
      previous_status: string | null
      status: string
      notes: string | null
      approved_at: string
    }> | null
    error: Error | null
  }

  if (error) {
    console.error("Error fetching approvals:", error)
    return { success: false, error: error.message }
  }

  if (!approvals || approvals.length === 0) {
    return { success: true, data: [] }
  }

  // Get story details (include deleted stories for historical report accuracy)
  const storyIds = Array.from(new Set(approvals.map(a => a.story_id)))
  const { data: stories } = await supabase
    .from("user_stories")
    .select("story_id, title, program_id")
    .in("story_id", storyIds) as {
      data: Array<{ story_id: string; title: string; program_id: string }> | null
      error: Error | null
    }

  const storyMap = new Map(stories?.map(s => [s.story_id, s]) || [])

  // Get user names
  const userIds = Array.from(new Set(approvals.map(a => a.approved_by)))
  const { data: users } = await supabase
    .from("users")
    .select("user_id, name")
    .in("user_id", userIds) as {
      data: Array<{ user_id: string; name: string }> | null
      error: Error | null
    }

  const userMap = new Map(users?.map(u => [u.user_id, u.name]) || [])

  // Get programs
  const programIds = Array.from(new Set(stories?.map(s => s.program_id) || []))
  const { data: programs } = await supabase
    .from("programs")
    .select("program_id, name")
    .in("program_id", programIds) as {
      data: Array<{ program_id: string; name: string }> | null
      error: Error | null
    }

  const programMap = new Map(programs?.map(p => [p.program_id, p.name]) || [])

  // Build report data
  let reportData: StatusTransitionReport[] = approvals.map(a => {
    const story = storyMap.get(a.story_id)
    return {
      story_id: a.story_id,
      title: story?.title || "Unknown",
      program_name: story ? (programMap.get(story.program_id) || story.program_id) : "Unknown",
      from_status: a.previous_status || "N/A",
      to_status: a.status,
      changed_by: userMap.get(a.approved_by) || "Unknown",
      changed_at: a.approved_at,
      notes: a.notes,
    }
  })

  // Filter by program if specified
  if (programId) {
    const programName = programMap.get(programId)
    reportData = reportData.filter(r => r.program_name === programName)
  }

  return { success: true, data: reportData }
}
