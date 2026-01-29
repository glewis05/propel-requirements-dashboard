"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ExecutionStatus, StepResult } from "@/types/database"

// ============================================================================
// Tester Execution Actions
// ============================================================================

export async function getMyAssignedTests(cycleId: string) {
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

  // Get assignments from the view
  const { data: assignments, error } = await supabase
    .from("tester_cycle_assignments")
    .select("*")
    .eq("cycle_id", cycleId)
    .eq("assigned_to", userData.user_id)
    .order("status", { ascending: true }) // Show assigned/in_progress first

  if (error) {
    console.error("Error fetching assigned tests:", error)
    return { success: false, error: error.message }
  }

  return { success: true, assignments: assignments || [] }
}

export async function selectTestPatient(
  executionId: string,
  patientId: string
) {
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

  // Verify execution belongs to user
  const { data: execution } = await supabase
    .from("test_executions")
    .select("assigned_to, status")
    .eq("execution_id", executionId)
    .single()

  if (!execution) {
    return { success: false, error: "Execution not found" }
  }

  if (execution.assigned_to !== userData.user_id) {
    return { success: false, error: "You can only modify tests assigned to you" }
  }

  if (!["assigned", "in_progress"].includes(execution.status)) {
    return { success: false, error: "Test patient can only be selected for pending tests" }
  }

  const { error } = await supabase
    .from("test_executions")
    .update({ test_patient_id: patientId } as never)
    .eq("execution_id", executionId)

  if (error) {
    console.error("Error selecting test patient:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/tester`)
  return { success: true }
}

export async function startTestExecution(executionId: string) {
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

  // Verify execution belongs to user
  const { data: execution } = await supabase
    .from("test_executions")
    .select("assigned_to, status, test_patient_id, cycle_id")
    .eq("execution_id", executionId)
    .single()

  if (!execution) {
    return { success: false, error: "Execution not found" }
  }

  if (execution.assigned_to !== userData.user_id) {
    return { success: false, error: "You can only start tests assigned to you" }
  }

  if (execution.status !== "assigned") {
    return { success: false, error: "Test has already been started" }
  }

  // Require test patient selection for cycle-based executions
  if (execution.cycle_id && !execution.test_patient_id) {
    return { success: false, error: "Please select a test patient before starting" }
  }

  const { error } = await supabase
    .from("test_executions")
    .update({
      status: "in_progress" as ExecutionStatus,
      started_at: new Date().toISOString(),
    } as never)
    .eq("execution_id", executionId)

  if (error) {
    console.error("Error starting execution:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/tester`)
  return { success: true }
}

export async function submitStepResult(
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
    .select("user_id")
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

  if (execution.assigned_to !== userData.user_id) {
    return { success: false, error: "You can only update tests assigned to you" }
  }

  if (execution.status !== "in_progress") {
    return { success: false, error: "Test must be in progress to update steps" }
  }

  // Update step results - merge with existing
  const existingResults = (execution.step_results as StepResult[] | null) || []
  const updatedResults = existingResults.filter(
    r => r.step_number !== stepResult.step_number
  )
  updatedResults.push({
    ...stepResult,
    executed_at: new Date().toISOString(),
  })
  updatedResults.sort((a, b) => a.step_number - b.step_number)

  const { error } = await supabase
    .from("test_executions")
    .update({
      step_results: JSON.stringify(updatedResults),
    } as never)
    .eq("execution_id", executionId)

  if (error) {
    console.error("Error updating step result:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/tester`)
  return { success: true }
}

export async function completeTestExecution(
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
    .select("user_id")
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

  if (execution.assigned_to !== userData.user_id) {
    return { success: false, error: "You can only complete tests assigned to you" }
  }

  if (execution.status !== "in_progress") {
    return { success: false, error: "Test must be in progress to complete" }
  }

  const { error } = await supabase
    .from("test_executions")
    .update({
      status: status as ExecutionStatus,
      completed_at: new Date().toISOString(),
      notes: notes || null,
    } as never)
    .eq("execution_id", executionId)

  if (error) {
    console.error("Error completing execution:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/tester`)
  return { success: true }
}

export async function getExecutionDetails(executionId: string) {
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

  // Get execution with test case details
  const { data: execution, error } = await supabase
    .from("test_executions")
    .select(`
      *,
      test_cases:test_case_id (
        test_case_id,
        title,
        description,
        preconditions,
        test_data,
        test_steps,
        expected_results,
        test_type,
        priority
      ),
      user_stories:story_id (
        title,
        user_story,
        acceptance_criteria
      ),
      test_patients:test_patient_id (
        patient_id,
        patient_name,
        mrn,
        description
      )
    `)
    .eq("execution_id", executionId)
    .single()

  if (error) {
    console.error("Error fetching execution details:", error)
    return { success: false, error: error.message }
  }

  // Verify user has access (assigned to them)
  if (execution.assigned_to !== userData.user_id) {
    return { success: false, error: "You do not have access to this test" }
  }

  return { success: true, execution }
}

export async function getTesterCycleSummary(cycleId: string) {
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

  // Get cycle info
  const { data: cycle, error: cycleError } = await supabase
    .from("uat_cycles")
    .select(`
      cycle_id,
      name,
      description,
      status,
      start_date,
      end_date,
      programs:program_id (name)
    `)
    .eq("cycle_id", cycleId)
    .single()

  if (cycleError) {
    console.error("Error fetching cycle:", cycleError)
    return { success: false, error: cycleError.message }
  }

  // Get user's workload for this cycle
  const { data: workload, error: workloadError } = await supabase
    .from("cycle_tester_workload")
    .select("*")
    .eq("cycle_id", cycleId)
    .eq("user_id", userData.user_id)
    .single()

  if (workloadError && workloadError.code !== "PGRST116") {
    console.error("Error fetching workload:", workloadError)
  }

  return {
    success: true,
    cycle: {
      ...cycle,
      program_name: (cycle.programs as Record<string, unknown>)?.name as string || "",
    },
    workload: workload || {
      total_assigned: 0,
      not_started: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
      blocked: 0,
    },
  }
}
