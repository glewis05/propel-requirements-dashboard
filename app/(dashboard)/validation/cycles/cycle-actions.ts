"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database, CycleStatus, DistributionMethod } from "@/types/database"

// Type aliases for table types
type UATCycleInsert = Database['public']['Tables']['uat_cycles']['Insert']
type UATCycleUpdate = Database['public']['Tables']['uat_cycles']['Update']

// ============================================================================
// Cycle CRUD Actions
// ============================================================================

export interface CycleFormData {
  name: string
  description?: string | null
  program_id: string
  distribution_method: DistributionMethod
  cross_validation_enabled: boolean
  cross_validation_percentage?: number | null
  validators_per_test?: number | null
  start_date?: string | null
  end_date?: string | null
}

export async function createCycle(data: CycleFormData) {
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

  if (!["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to create cycles" }
  }

  const cycleInsert: UATCycleInsert = {
    name: data.name,
    description: data.description || null,
    program_id: data.program_id,
    status: "draft",
    distribution_method: data.distribution_method,
    cross_validation_enabled: data.cross_validation_enabled,
    cross_validation_percentage: data.cross_validation_enabled ? data.cross_validation_percentage : null,
    validators_per_test: data.cross_validation_enabled ? data.validators_per_test : null,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    created_by: userData.user_id,
  }

  const { data: cycle, error } = await supabase
    .from("uat_cycles")
    .insert(cycleInsert)
    .select("cycle_id")
    .single()

  if (error) {
    console.error("Error creating cycle:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/cycles")
  return { success: true, cycleId: cycle?.cycle_id }
}

export async function updateCycle(
  cycleId: string,
  data: Partial<CycleFormData>
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

  if (!["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to update cycles" }
  }

  // Check if cycle is locked
  const { data: existingCycle } = await supabase
    .from("uat_cycles")
    .select("locked_at")
    .eq("cycle_id", cycleId)
    .single()

  if (existingCycle?.locked_at) {
    return { success: false, error: "Cannot update a locked cycle" }
  }

  const updateData: UATCycleUpdate = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.program_id !== undefined) updateData.program_id = data.program_id
  if (data.distribution_method !== undefined) updateData.distribution_method = data.distribution_method
  if (data.cross_validation_enabled !== undefined) {
    updateData.cross_validation_enabled = data.cross_validation_enabled
    if (!data.cross_validation_enabled) {
      updateData.cross_validation_percentage = null
      updateData.validators_per_test = null
    }
  }
  if (data.cross_validation_percentage !== undefined) updateData.cross_validation_percentage = data.cross_validation_percentage
  if (data.validators_per_test !== undefined) updateData.validators_per_test = data.validators_per_test
  if (data.start_date !== undefined) updateData.start_date = data.start_date
  if (data.end_date !== undefined) updateData.end_date = data.end_date

  const { error } = await supabase
    .from("uat_cycles")
    .update(updateData)
    .eq("cycle_id", cycleId)

  if (error) {
    console.error("Error updating cycle:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/cycles")
  revalidatePath(`/uat/cycles/${cycleId}`)
  return { success: true }
}

export async function updateCycleStatus(cycleId: string, status: CycleStatus) {
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

  if (!["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to update cycle status" }
  }

  const statusUpdate: UATCycleUpdate = { status }

  const { error } = await supabase
    .from("uat_cycles")
    .update(statusUpdate)
    .eq("cycle_id", cycleId)

  if (error) {
    console.error("Error updating cycle status:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/cycles")
  revalidatePath(`/uat/cycles/${cycleId}`)
  return { success: true }
}

export async function lockCycle(cycleId: string) {
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
    return { success: false, error: "You do not have permission to lock cycles" }
  }

  const lockUpdate: UATCycleUpdate = {
    locked_at: new Date().toISOString(),
    locked_by: userData.user_id,
  }

  const { error } = await supabase
    .from("uat_cycles")
    .update(lockUpdate)
    .eq("cycle_id", cycleId)

  if (error) {
    console.error("Error locking cycle:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/cycles")
  revalidatePath(`/uat/cycles/${cycleId}`)
  return { success: true }
}

export async function deleteCycle(cycleId: string) {
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

  if (userData.role !== "Admin") {
    return { success: false, error: "Only admins can delete cycles" }
  }

  // Check if cycle is locked
  const { data: existingCycle } = await supabase
    .from("uat_cycles")
    .select("locked_at")
    .eq("cycle_id", cycleId)
    .single()

  if (existingCycle?.locked_at) {
    return { success: false, error: "Cannot delete a locked cycle" }
  }

  const { error } = await supabase
    .from("uat_cycles")
    .delete()
    .eq("cycle_id", cycleId)

  if (error) {
    console.error("Error deleting cycle:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/cycles")
  return { success: true }
}

// ============================================================================
// Cycle Query Actions
// ============================================================================

export interface CycleRow {
  cycle_id: string
  name: string
  description: string | null
  program_id: string
  status: CycleStatus
  distribution_method: DistributionMethod
  cross_validation_enabled: boolean
  cross_validation_percentage: number | null
  validators_per_test: number | null
  start_date: string | null
  end_date: string | null
  locked_at: string | null
  locked_by: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export interface CycleSummaryRow extends CycleRow {
  program_name?: string
  active_testers?: number
  total_assignments?: number
  primary_assignments?: number
  cv_assignments?: number
  completed_count?: number
  failed_count?: number
  blocked_count?: number
  pending_count?: number
}

export async function getCycleById(cycleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: cycle, error } = await supabase
    .from("uat_cycles")
    .select("*")
    .eq("cycle_id", cycleId)
    .single() as { data: CycleRow | null; error: Error | null }

  if (error) {
    console.error("Error fetching cycle:", error)
    return { success: false, error: error.message }
  }

  return { success: true, cycle }
}

export async function getAllCycles(filters?: {
  programId?: string
  status?: CycleStatus
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  let query = supabase
    .from("uat_cycle_summary")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters?.programId) {
    query = query.eq("program_id", filters.programId)
  }
  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  const { data: cycles, error } = await query as { data: CycleSummaryRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching cycles:", error)
    return { success: false, error: error.message }
  }

  return { success: true, cycles: cycles || [] }
}

export async function getMyCycles() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  // Get cycles where user is an active tester
  const { data: testerAssignments, error: testerError } = await supabase
    .from("cycle_testers")
    .select("cycle_id")
    .eq("user_id", userData.user_id)
    .eq("is_active", true)

  if (testerError) {
    console.error("Error fetching tester assignments:", testerError)
    return { success: false, error: testerError.message }
  }

  if (!testerAssignments || testerAssignments.length === 0) {
    return { success: true, cycles: [] }
  }

  const cycleIds = testerAssignments.map(a => a.cycle_id)

  const { data: cycles, error } = await supabase
    .from("uat_cycle_summary")
    .select("*")
    .in("cycle_id", cycleIds)
    .in("status", ["active", "completed"])
    .order("created_at", { ascending: false }) as { data: CycleSummaryRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching my cycles:", error)
    return { success: false, error: error.message }
  }

  return { success: true, cycles: cycles || [] }
}
