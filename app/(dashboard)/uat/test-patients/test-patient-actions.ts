"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ============================================================================
// Test Patient CRUD Actions
// ============================================================================

export interface TestPatientFormData {
  program_id: string
  patient_name: string
  mrn: string
  date_of_birth?: string | null
  description?: string | null
  test_data_notes?: string | null
}

export async function createTestPatient(data: TestPatientFormData) {
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
    return { success: false, error: "You do not have permission to manage test patients" }
  }

  const { data: patient, error } = await supabase
    .from("test_patients")
    .insert({
      program_id: data.program_id,
      patient_name: data.patient_name,
      mrn: data.mrn,
      date_of_birth: data.date_of_birth || null,
      description: data.description || null,
      test_data_notes: data.test_data_notes || null,
      is_active: true,
      created_by: userData.user_id,
    } as never)
    .select("patient_id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A patient with this MRN already exists for this program" }
    }
    console.error("Error creating test patient:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/test-patients")
  return { success: true, patientId: patient?.patient_id }
}

export async function updateTestPatient(
  patientId: string,
  data: Partial<TestPatientFormData>
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
    return { success: false, error: "You do not have permission to manage test patients" }
  }

  const updateData: Record<string, unknown> = {}
  if (data.patient_name !== undefined) updateData.patient_name = data.patient_name
  if (data.mrn !== undefined) updateData.mrn = data.mrn
  if (data.date_of_birth !== undefined) updateData.date_of_birth = data.date_of_birth
  if (data.description !== undefined) updateData.description = data.description
  if (data.test_data_notes !== undefined) updateData.test_data_notes = data.test_data_notes

  const { error } = await supabase
    .from("test_patients")
    .update(updateData as never)
    .eq("patient_id", patientId)

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A patient with this MRN already exists for this program" }
    }
    console.error("Error updating test patient:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/test-patients")
  return { success: true }
}

export async function deactivateTestPatient(patientId: string) {
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
    return { success: false, error: "You do not have permission to manage test patients" }
  }

  const { error } = await supabase
    .from("test_patients")
    .update({ is_active: false } as never)
    .eq("patient_id", patientId)

  if (error) {
    console.error("Error deactivating test patient:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/test-patients")
  return { success: true }
}

export async function reactivateTestPatient(patientId: string) {
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
    return { success: false, error: "You do not have permission to manage test patients" }
  }

  const { error } = await supabase
    .from("test_patients")
    .update({ is_active: true } as never)
    .eq("patient_id", patientId)

  if (error) {
    console.error("Error reactivating test patient:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/test-patients")
  return { success: true }
}

export async function deleteTestPatient(patientId: string) {
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
    return { success: false, error: "Only admins can delete test patients" }
  }

  // Check if patient is used in any executions
  const { data: executions } = await supabase
    .from("test_executions")
    .select("execution_id")
    .eq("test_patient_id", patientId)
    .limit(1)

  if (executions && executions.length > 0) {
    return { success: false, error: "Cannot delete patient that has been used in test executions. Deactivate instead." }
  }

  const { error } = await supabase
    .from("test_patients")
    .delete()
    .eq("patient_id", patientId)

  if (error) {
    console.error("Error deleting test patient:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/test-patients")
  return { success: true }
}

// ============================================================================
// Test Patient Query Actions
// ============================================================================

export interface TestPatientRow {
  patient_id: string
  program_id: string
  patient_name: string
  mrn: string
  date_of_birth: string | null
  description: string | null
  test_data_notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export interface TestPatientWithProgram extends TestPatientRow {
  program_name?: string
}

export async function getTestPatients(filters?: {
  programId?: string
  isActive?: boolean
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  let query = supabase
    .from("test_patients")
    .select(`
      *,
      programs:program_id (name)
    `)
    .order("patient_name", { ascending: true })

  if (filters?.programId) {
    query = query.eq("program_id", filters.programId)
  }
  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive)
  }

  const { data: patients, error } = await query

  if (error) {
    console.error("Error fetching test patients:", error)
    return { success: false, error: error.message }
  }

  // Transform to include program name
  const transformedPatients = (patients || []).map(p => ({
    ...p,
    program_name: (p.programs as Record<string, unknown>)?.name as string || "",
    programs: undefined,
  })) as TestPatientWithProgram[]

  return { success: true, patients: transformedPatients }
}

export async function getTestPatientById(patientId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: patient, error } = await supabase
    .from("test_patients")
    .select(`
      *,
      programs:program_id (name)
    `)
    .eq("patient_id", patientId)
    .single()

  if (error) {
    console.error("Error fetching test patient:", error)
    return { success: false, error: error.message }
  }

  const transformedPatient = {
    ...patient,
    program_name: (patient.programs as Record<string, unknown>)?.name as string || "",
    programs: undefined,
  } as TestPatientWithProgram

  return { success: true, patient: transformedPatient }
}

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
    console.error("Error fetching test patients for execution:", error)
    return { success: false, error: error.message }
  }

  return { success: true, patients: patients || [] }
}
