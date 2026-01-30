"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/database"

// Type aliases for cycle_testers table operations
type CycleTestersInsert = Database['public']['Tables']['cycle_testers']['Insert']
type CycleTestersUpdate = Database['public']['Tables']['cycle_testers']['Update']

// ============================================================================
// Tester Pool Management Actions
// ============================================================================

export async function addTesterToCycle(
  cycleId: string,
  userId: string,
  capacityWeight: number = 100
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
    return { success: false, error: "You do not have permission to manage tester pools" }
  }

  // Check if cycle is locked
  const { data: cycle } = await supabase
    .from("uat_cycles")
    .select("locked_at")
    .eq("cycle_id", cycleId)
    .single()

  if (cycle?.locked_at) {
    return { success: false, error: "Cannot modify testers on a locked cycle" }
  }

  // Validate capacity weight
  if (capacityWeight < 1 || capacityWeight > 100) {
    return { success: false, error: "Capacity weight must be between 1 and 100" }
  }

  const insertData: CycleTestersInsert = {
    cycle_id: cycleId,
    user_id: userId,
    capacity_weight: capacityWeight,
    is_active: true,
    added_by: userData.user_id,
  }

  const { error } = await supabase
    .from("cycle_testers")
    .insert(insertData)

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation - tester already in cycle
      return { success: false, error: "Tester is already assigned to this cycle" }
    }
    console.error("Error adding tester to cycle:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/uat/cycles/${cycleId}`)
  revalidatePath(`/uat/cycles/${cycleId}/testers`)
  return { success: true }
}

export async function addMultipleTestersToCycle(
  cycleId: string,
  userIds: string[],
  capacityWeight: number = 100
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
    return { success: false, error: "You do not have permission to manage tester pools" }
  }

  // Check if cycle is locked
  const { data: cycle } = await supabase
    .from("uat_cycles")
    .select("locked_at")
    .eq("cycle_id", cycleId)
    .single()

  if (cycle?.locked_at) {
    return { success: false, error: "Cannot modify testers on a locked cycle" }
  }

  const insertData: CycleTestersInsert[] = userIds.map(userId => ({
    cycle_id: cycleId,
    user_id: userId,
    capacity_weight: capacityWeight,
    is_active: true,
    added_by: userData.user_id,
  }))

  const { error } = await supabase
    .from("cycle_testers")
    .upsert(insertData, { onConflict: "cycle_id,user_id" })

  if (error) {
    console.error("Error adding testers to cycle:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/uat/cycles/${cycleId}`)
  revalidatePath(`/uat/cycles/${cycleId}/testers`)
  return { success: true, count: userIds.length }
}

export async function removeTesterFromCycle(cycleId: string, userId: string) {
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
    return { success: false, error: "You do not have permission to manage tester pools" }
  }

  // Check if cycle is locked
  const { data: cycle } = await supabase
    .from("uat_cycles")
    .select("locked_at")
    .eq("cycle_id", cycleId)
    .single()

  if (cycle?.locked_at) {
    return { success: false, error: "Cannot modify testers on a locked cycle" }
  }

  // Check if tester has any assignments in this cycle
  const { data: assignments } = await supabase
    .from("test_executions")
    .select("execution_id")
    .eq("cycle_id", cycleId)
    .eq("assigned_to", userId)
    .limit(1)

  if (assignments && assignments.length > 0) {
    // Soft delete - mark as inactive instead of removing
    const deactivateData: CycleTestersUpdate = { is_active: false }
    const { error } = await supabase
      .from("cycle_testers")
      .update(deactivateData)
      .eq("cycle_id", cycleId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error deactivating tester:", error)
      return { success: false, error: error.message }
    }
  } else {
    // No assignments - can safely delete
    const { error } = await supabase
      .from("cycle_testers")
      .delete()
      .eq("cycle_id", cycleId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error removing tester from cycle:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath(`/uat/cycles/${cycleId}`)
  revalidatePath(`/uat/cycles/${cycleId}/testers`)
  return { success: true }
}

export async function updateTesterCapacity(
  cycleId: string,
  userId: string,
  capacityWeight: number
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
    return { success: false, error: "You do not have permission to manage tester pools" }
  }

  // Check if cycle is locked
  const { data: cycle } = await supabase
    .from("uat_cycles")
    .select("locked_at")
    .eq("cycle_id", cycleId)
    .single()

  if (cycle?.locked_at) {
    return { success: false, error: "Cannot modify testers on a locked cycle" }
  }

  // Validate capacity weight
  if (capacityWeight < 1 || capacityWeight > 100) {
    return { success: false, error: "Capacity weight must be between 1 and 100" }
  }

  const updateCapacityData: CycleTestersUpdate = { capacity_weight: capacityWeight }

  const { error } = await supabase
    .from("cycle_testers")
    .update(updateCapacityData)
    .eq("cycle_id", cycleId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error updating tester capacity:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/uat/cycles/${cycleId}`)
  revalidatePath(`/uat/cycles/${cycleId}/testers`)
  return { success: true }
}

export async function reactivateTester(cycleId: string, userId: string) {
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
    return { success: false, error: "You do not have permission to manage tester pools" }
  }

  const reactivateData: CycleTestersUpdate = { is_active: true }

  const { error } = await supabase
    .from("cycle_testers")
    .update(reactivateData)
    .eq("cycle_id", cycleId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error reactivating tester:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/uat/cycles/${cycleId}`)
  revalidatePath(`/uat/cycles/${cycleId}/testers`)
  return { success: true }
}

// ============================================================================
// Tester Query Actions
// ============================================================================

export interface CycleTesterRow {
  id: string
  cycle_id: string
  user_id: string
  capacity_weight: number
  is_active: boolean
  added_at: string
  added_by: string
}

export interface CycleTesterWithUser extends CycleTesterRow {
  user_name?: string
  user_email?: string
  user_role?: string
}

export interface TesterWorkloadRow {
  cycle_id: string
  user_id: string
  tester_name: string
  capacity_weight: number
  is_active: boolean
  total_assigned: number
  primary_assigned: number
  cv_assigned: number
  not_started: number
  in_progress: number
  completed: number
  failed: number
  blocked: number
}

export async function getCycleTesters(cycleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get testers with user info
  const { data: testers, error } = await supabase
    .from("cycle_testers")
    .select(`
      *,
      users:user_id (
        name,
        email,
        role
      )
    `)
    .eq("cycle_id", cycleId)
    .order("added_at", { ascending: true })

  if (error) {
    console.error("Error fetching cycle testers:", error)
    return { success: false, error: error.message }
  }

  // Transform the data
  const transformedTesters = (testers || []).map((t: Record<string, unknown>) => ({
    ...t,
    user_name: (t.users as Record<string, unknown>)?.name as string | undefined,
    user_email: (t.users as Record<string, unknown>)?.email as string | undefined,
    user_role: (t.users as Record<string, unknown>)?.role as string | undefined,
    users: undefined,
  })) as CycleTesterWithUser[]

  return { success: true, testers: transformedTesters }
}

export async function getCycleTesterWorkload(cycleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: workload, error } = await supabase
    .from("cycle_tester_workload")
    .select("*")
    .eq("cycle_id", cycleId) as { data: TesterWorkloadRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching tester workload:", error)
    return { success: false, error: error.message }
  }

  return { success: true, workload: workload || [] }
}

export async function getAvailableTesters(programId?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  let query = supabase
    .from("users")
    .select("user_id, name, email, role, assigned_programs")
    .in("role", ["UAT Tester", "UAT Manager"])
    .eq("status", "Active")
    .order("name", { ascending: true })

  // If programId is provided, filter by assigned programs
  if (programId) {
    query = query.contains("assigned_programs", [programId])
  }

  const { data: testers, error } = await query

  if (error) {
    console.error("Error fetching available testers:", error)
    return { success: false, error: error.message }
  }

  return { success: true, testers: testers || [] }
}
