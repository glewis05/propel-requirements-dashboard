"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database, DefectSeverity, DefectStatus, UserRole } from "@/types/database"
import { getAllowedDefectTransitions } from "@/lib/uat/execution-transitions"

// Type aliases for table types
type DefectInsert = Database['public']['Tables']['defects']['Insert']
type DefectUpdate = Database['public']['Tables']['defects']['Update']

// ============================================================================
// Defect CRUD Actions
// ============================================================================

export interface DefectFormData {
  execution_id?: string
  test_case_id?: string
  story_id: string
  program_id: string
  title: string
  description?: string
  steps_to_reproduce?: string
  expected_behavior?: string
  actual_behavior?: string
  severity: DefectSeverity
  environment?: string
  failed_step_number?: number
}

export async function createDefect(data: DefectFormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  if (!["Admin", "Portfolio Manager", "Program Manager", "UAT Manager", "UAT Tester"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to create defects" }
  }

  const defectInsert: DefectInsert = {
    execution_id: data.execution_id || null,
    test_case_id: data.test_case_id || null,
    story_id: data.story_id,
    program_id: data.program_id,
    title: data.title,
    description: data.description || null,
    steps_to_reproduce: data.steps_to_reproduce || null,
    expected_behavior: data.expected_behavior || null,
    actual_behavior: data.actual_behavior || null,
    severity: data.severity,
    status: "open",
    reported_by: userData.user_id,
    environment: data.environment || null,
    failed_step_number: data.failed_step_number || null,
  }

  const { data: defect, error } = await supabase
    .from("defects")
    .insert(defectInsert)
    .select("defect_id")
    .single()

  if (error) {
    console.error("Error creating defect:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/defects")
  revalidatePath("/uat")
  return { success: true, defectId: defect?.defect_id }
}

export async function updateDefect(defectId: string, data: Partial<DefectFormData>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  const updateData: DefectUpdate = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.steps_to_reproduce !== undefined) updateData.steps_to_reproduce = data.steps_to_reproduce
  if (data.expected_behavior !== undefined) updateData.expected_behavior = data.expected_behavior
  if (data.actual_behavior !== undefined) updateData.actual_behavior = data.actual_behavior
  if (data.severity !== undefined) updateData.severity = data.severity
  if (data.environment !== undefined) updateData.environment = data.environment

  const { error } = await supabase
    .from("defects")
    .update(updateData)
    .eq("defect_id", defectId)

  if (error) {
    console.error("Error updating defect:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/defects")
  revalidatePath(`/uat/defects/${defectId}`)
  return { success: true }
}

export async function transitionDefect(
  defectId: string,
  newStatus: DefectStatus,
  notes?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  // Fetch current defect
  const { data: defect } = await supabase
    .from("defects")
    .select("status")
    .eq("defect_id", defectId)
    .single()

  if (!defect) {
    return { success: false, error: "Defect not found" }
  }

  const currentStatus = defect.status as DefectStatus
  const allowed = getAllowedDefectTransitions(currentStatus, userData.role as UserRole)

  if (!allowed.some(t => t.to === newStatus)) {
    return { success: false, error: `Cannot transition from ${currentStatus} to ${newStatus}` }
  }

  const transitionUpdate: DefectUpdate = {
    status: newStatus,
  }

  if (newStatus === "fixed" || newStatus === "verified" || newStatus === "closed") {
    transitionUpdate.resolved_by = userData.user_id
    transitionUpdate.resolved_at = new Date().toISOString()
  }

  if (notes) {
    transitionUpdate.description = notes
  }

  const { error } = await supabase
    .from("defects")
    .update(transitionUpdate)
    .eq("defect_id", defectId)

  if (error) {
    console.error("Error transitioning defect:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/defects")
  revalidatePath(`/uat/defects/${defectId}`)
  revalidatePath("/uat")
  return { success: true }
}

export async function assignDefect(defectId: string, assignedTo: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  if (!["Admin", "Portfolio Manager", "UAT Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to assign defects" }
  }

  const assignUpdate: DefectUpdate = { assigned_to: assignedTo }

  const { error } = await supabase
    .from("defects")
    .update(assignUpdate)
    .eq("defect_id", defectId)

  if (error) {
    console.error("Error assigning defect:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/defects")
  revalidatePath(`/uat/defects/${defectId}`)
  return { success: true }
}

// ============================================================================
// Defect Query Actions
// ============================================================================

interface DefectRow {
  defect_id: string
  execution_id: string | null
  test_case_id: string | null
  story_id: string
  program_id: string
  title: string
  description: string | null
  steps_to_reproduce: string | null
  expected_behavior: string | null
  actual_behavior: string | null
  severity: DefectSeverity
  status: DefectStatus
  reported_by: string
  assigned_to: string | null
  resolved_by: string | null
  resolved_at: string | null
  attachments: unknown[]
  environment: string | null
  failed_step_number: number | null
  created_at: string
  updated_at: string
}

export async function getAllDefects(filters?: {
  storyId?: string
  programId?: string
  severity?: string
  status?: string
  search?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  let query = supabase
    .from("defects")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters?.storyId) {
    query = query.eq("story_id", filters.storyId)
  }
  if (filters?.programId) {
    query = query.eq("program_id", filters.programId)
  }
  if (filters?.severity) {
    query = query.eq("severity", filters.severity)
  }
  if (filters?.status) {
    query = query.eq("status", filters.status)
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`)
  }

  const { data: defects, error } = await query as { data: DefectRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching defects:", error)
    return { success: false, error: error.message }
  }

  return { success: true, defects: defects || [] }
}

export async function getDefectById(defectId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: defect, error } = await supabase
    .from("defects")
    .select("*")
    .eq("defect_id", defectId)
    .single() as { data: DefectRow | null; error: Error | null }

  if (error) {
    console.error("Error fetching defect:", error)
    return { success: false, error: error.message }
  }

  return { success: true, defect }
}

export async function getDefectsForStory(storyId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: defects, error } = await supabase
    .from("defects")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false }) as { data: DefectRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching defects for story:", error)
    return { success: false, error: error.message }
  }

  return { success: true, defects: defects || [] }
}
