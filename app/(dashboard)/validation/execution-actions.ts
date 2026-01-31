"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ExecutionStatus, StepResult, Database } from "@/types/database"
import { canTransitionExecution } from "@/lib/validation/execution-transitions"
import type { UserRole } from "@/types/database"

// Type aliases for test_executions table operations
type TestExecutionsInsert = Database['public']['Tables']['test_executions']['Insert']
type TestExecutionsUpdate = Database['public']['Tables']['test_executions']['Update']

// ============================================================================
// Execution CRUD Actions
// ============================================================================

export async function createExecution(data: {
  test_case_id: string
  story_id: string
  assigned_to: string
  environment?: string
  browser_device?: string
  cycle_name?: string
}) {
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
    return { success: false, error: "You do not have permission to assign tests" }
  }

  const insertData: TestExecutionsInsert = {
    test_case_id: data.test_case_id,
    story_id: data.story_id,
    assigned_to: data.assigned_to,
    assigned_by: userData.user_id,
    status: "assigned" as ExecutionStatus,
    environment: data.environment || null,
    browser_device: data.browser_device || null,
    cycle_name: data.cycle_name || null,
  }

  const { data: execution, error } = await supabase
    .from("test_executions")
    .insert(insertData)
    .select("execution_id")
    .single()

  if (error) {
    console.error("Error creating execution:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/executions")
  revalidatePath("/uat")
  return { success: true, executionId: execution?.execution_id }
}

export async function assignExecution(data: {
  test_case_ids: string[]
  story_id: string
  assigned_to: string
  environment?: string
  cycle_name?: string
}) {
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
    return { success: false, error: "You do not have permission to assign tests" }
  }

  const insertData: TestExecutionsInsert[] = data.test_case_ids.map(tcId => ({
    test_case_id: tcId,
    story_id: data.story_id,
    assigned_to: data.assigned_to,
    assigned_by: userData.user_id,
    status: "assigned" as ExecutionStatus,
    environment: data.environment || null,
    cycle_name: data.cycle_name || null,
  }))

  const { error } = await supabase
    .from("test_executions")
    .insert(insertData)

  if (error) {
    console.error("Error assigning executions:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/executions")
  revalidatePath("/uat")
  return { success: true, count: data.test_case_ids.length }
}

export async function startExecution(executionId: string) {
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

  // Fetch current execution
  const { data: execution } = await supabase
    .from("test_executions")
    .select("status, assigned_to")
    .eq("execution_id", executionId)
    .single()

  if (!execution) {
    return { success: false, error: "Execution not found" }
  }

  const currentStatus = execution.status as ExecutionStatus
  if (!canTransitionExecution(currentStatus, "in_progress", userData.role as UserRole)) {
    return { success: false, error: "Cannot start this execution" }
  }

  // Only the assigned tester or managers can start
  if (userData.role === "UAT Tester" && execution.assigned_to !== userData.user_id) {
    return { success: false, error: "You can only start tests assigned to you" }
  }

  const startData: TestExecutionsUpdate = {
    status: "in_progress",
    started_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from("test_executions")
    .update(startData)
    .eq("execution_id", executionId)

  if (error) {
    console.error("Error starting execution:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/executions")
  revalidatePath(`/uat/executions/${executionId}`)
  return { success: true }
}

export async function updateStepResult(
  executionId: string,
  stepResult: StepResult
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

  // Fetch current execution
  const { data: execution } = await supabase
    .from("test_executions")
    .select("status, assigned_to, step_results")
    .eq("execution_id", executionId)
    .single()

  if (!execution) {
    return { success: false, error: "Execution not found" }
  }

  if (execution.status !== "in_progress") {
    return { success: false, error: "Execution must be in progress to update steps" }
  }

  // Only assigned tester or managers can update steps
  if (userData.role === "UAT Tester" && execution.assigned_to !== userData.user_id) {
    return { success: false, error: "You can only update tests assigned to you" }
  }

  // Update step results - merge with existing
  const existingResults = (execution.step_results as StepResult[] | null) || []
  const updatedResults = existingResults.filter(
    r => r.step_number !== stepResult.step_number
  )
  updatedResults.push(stepResult)
  updatedResults.sort((a, b) => a.step_number - b.step_number)

  const stepUpdateData: TestExecutionsUpdate = {
    step_results: JSON.stringify(updatedResults),
  }

  const { error } = await supabase
    .from("test_executions")
    .update(stepUpdateData)
    .eq("execution_id", executionId)

  if (error) {
    console.error("Error updating step result:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/uat/executions/${executionId}`)
  return { success: true }
}

export async function completeExecution(
  executionId: string,
  status: "passed" | "failed" | "blocked",
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

  // Fetch current execution
  const { data: execution } = await supabase
    .from("test_executions")
    .select("status, assigned_to")
    .eq("execution_id", executionId)
    .single()

  if (!execution) {
    return { success: false, error: "Execution not found" }
  }

  const currentStatus = execution.status as ExecutionStatus
  if (!canTransitionExecution(currentStatus, status, userData.role as UserRole)) {
    return { success: false, error: `Cannot transition from ${currentStatus} to ${status}` }
  }

  if (userData.role === "UAT Tester" && execution.assigned_to !== userData.user_id) {
    return { success: false, error: "You can only complete tests assigned to you" }
  }

  const completeData: TestExecutionsUpdate = {
    status,
    completed_at: new Date().toISOString(),
    notes: notes || null,
  }

  const { error } = await supabase
    .from("test_executions")
    .update(completeData)
    .eq("execution_id", executionId)

  if (error) {
    console.error("Error completing execution:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/executions")
  revalidatePath(`/uat/executions/${executionId}`)
  revalidatePath("/uat")
  return { success: true }
}

export async function verifyExecution(executionId: string) {
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
    return { success: false, error: "You do not have permission to verify executions" }
  }

  const { data: execution } = await supabase
    .from("test_executions")
    .select("status")
    .eq("execution_id", executionId)
    .single()

  if (!execution || execution.status !== "passed") {
    return { success: false, error: "Only passed executions can be verified" }
  }

  const verifyData: TestExecutionsUpdate = {
    status: "verified",
    verified_by: userData.user_id,
    verified_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from("test_executions")
    .update(verifyData)
    .eq("execution_id", executionId)

  if (error) {
    console.error("Error verifying execution:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/executions")
  revalidatePath(`/uat/executions/${executionId}`)
  revalidatePath("/uat")
  return { success: true }
}

// ============================================================================
// Execution Query Actions
// ============================================================================

interface ExecutionRow {
  execution_id: string
  test_case_id: string
  story_id: string
  assigned_to: string
  assigned_by: string
  assigned_at: string
  status: ExecutionStatus
  step_results: StepResult[]
  started_at: string | null
  completed_at: string | null
  verified_by: string | null
  verified_at: string | null
  environment: string | null
  browser_device: string | null
  cycle_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getMyExecutions() {
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

  const { data: executions, error } = await supabase
    .from("test_executions")
    .select("*")
    .eq("assigned_to", userData.user_id)
    .order("assigned_at", { ascending: false }) as { data: ExecutionRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching my executions:", error)
    return { success: false, error: error.message }
  }

  return { success: true, executions: executions || [] }
}

export async function getAllExecutions(filters?: {
  storyId?: string
  status?: string
  assignedTo?: string
  cycleName?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  let query = supabase
    .from("test_executions")
    .select("*")
    .order("assigned_at", { ascending: false })

  if (filters?.storyId) {
    query = query.eq("story_id", filters.storyId)
  }
  if (filters?.status) {
    query = query.eq("status", filters.status)
  }
  if (filters?.assignedTo) {
    query = query.eq("assigned_to", filters.assignedTo)
  }
  if (filters?.cycleName) {
    query = query.eq("cycle_name", filters.cycleName)
  }

  const { data: executions, error } = await query as { data: ExecutionRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching executions:", error)
    return { success: false, error: error.message }
  }

  return { success: true, executions: executions || [] }
}

export async function getExecutionById(executionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: execution, error } = await supabase
    .from("test_executions")
    .select("*")
    .eq("execution_id", executionId)
    .single() as { data: ExecutionRow | null; error: Error | null }

  if (error) {
    console.error("Error fetching execution:", error)
    return { success: false, error: error.message }
  }

  return { success: true, execution }
}
