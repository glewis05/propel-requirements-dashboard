"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ExecutionService } from "@/lib/services"
import type { StepResult } from "@/types/database"

/**
 * Get tests assigned to the current user for a cycle
 */
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

  const service = new ExecutionService(supabase)
  const result = await service.getAssignedTests(userData.user_id, cycleId)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return { success: true, assignments: result.data || [] }
}

/**
 * Select a test patient for an execution
 */
export async function selectTestPatient(executionId: string, patientId: string) {
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

  const service = new ExecutionService(supabase)
  const result = await service.selectTestPatient(executionId, patientId, userData.user_id)

  if (result.success) {
    revalidatePath(`/tester`)
    revalidatePath(`/my-tests`)
  }

  return result
}

/**
 * Start a test execution
 */
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

  const service = new ExecutionService(supabase)
  const result = await service.startExecution(executionId, userData.user_id)

  if (result.success) {
    revalidatePath(`/tester`)
    revalidatePath(`/my-tests`)
  }

  return result
}

/**
 * Submit a step result
 */
export async function submitStepResult(executionId: string, stepResult: StepResult) {
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

  const service = new ExecutionService(supabase)
  const result = await service.submitStepResult(
    executionId,
    {
      step_number: stepResult.step_number,
      status: stepResult.status,
      actual_result: stepResult.actual_result,
      notes: stepResult.notes,
    },
    userData.user_id
  )

  if (result.success) {
    revalidatePath(`/tester`)
    revalidatePath(`/my-tests`)
  }

  return result
}

/**
 * Complete a test execution
 */
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

  const service = new ExecutionService(supabase)
  const result = await service.completeExecution(executionId, status, userData.user_id, notes)

  if (result.success) {
    revalidatePath(`/tester`)
    revalidatePath(`/my-tests`)
  }

  return result
}

/**
 * Get execution details with related data
 */
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

  const service = new ExecutionService(supabase)
  const result = await service.getExecutionDetails(executionId, userData.user_id)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return { success: true, execution: result.data }
}

/**
 * Get cycle summary for the current tester
 */
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

  const service = new ExecutionService(supabase)
  const result = await service.getTesterCycleSummary(cycleId, userData.user_id)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return {
    success: true,
    cycle: result.data?.cycle,
    workload: result.data?.workload,
  }
}

/**
 * Get cycles where the current user is an active tester
 */
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
    return { success: false, error: testerError.message }
  }

  if (!testerAssignments || testerAssignments.length === 0) {
    return { success: true, cycles: [] }
  }

  const cycleIds = testerAssignments.map(a => a.cycle_id)

  // Get cycle details
  const { data: cycles, error: cyclesError } = await supabase
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
    .in("cycle_id", cycleIds)
    .in("status", ["active", "in_progress"])
    .order("start_date", { ascending: false })

  if (cyclesError) {
    return { success: false, error: cyclesError.message }
  }

  return {
    success: true,
    cycles: (cycles || []).map(c => ({
      ...c,
      program_name: (c.programs as Record<string, unknown>)?.name || "",
    })),
  }
}

/**
 * Get cycle details by ID
 */
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
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, cycle }
}

/**
 * Get available test patients for execution (by program)
 */
export async function getTestPatientsForExecution(programId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: patients, error } = await supabase
    .from("test_patients")
    .select("patient_id, patient_name, mrn, description")
    .eq("program_id", programId)
    .eq("is_active", true)
    .order("patient_name", { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, patients: patients || [] }
}
