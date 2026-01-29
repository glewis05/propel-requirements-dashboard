"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { TestCaseStatus, TestStep } from "@/types/database"

// ============================================================================
// Test Case CRUD Actions
// ============================================================================

export interface TestCaseFormData {
  story_id: string
  program_id: string
  title: string
  description?: string
  preconditions?: string
  test_data?: string
  test_steps: TestStep[]
  expected_results?: string
  test_type: string
  priority: string
}

export async function createTestCase(data: TestCaseFormData) {
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
    return { success: false, error: "You do not have permission to create test cases" }
  }

  const { data: testCase, error } = await supabase
    .from("test_cases")
    .insert({
      story_id: data.story_id,
      program_id: data.program_id,
      title: data.title,
      description: data.description || null,
      preconditions: data.preconditions || null,
      test_data: data.test_data || null,
      test_steps: JSON.stringify(data.test_steps),
      expected_results: data.expected_results || null,
      test_type: data.test_type,
      priority: data.priority,
      status: "draft" as TestCaseStatus,
      created_by: userData.user_id,
    } as never)
    .select("test_case_id")
    .single()

  if (error) {
    console.error("Error creating test case:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/test-cases")
  revalidatePath("/uat")
  return { success: true, testCaseId: testCase?.test_case_id }
}

export async function updateTestCase(testCaseId: string, data: Partial<TestCaseFormData> & { status?: TestCaseStatus }) {
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
    return { success: false, error: "You do not have permission to edit test cases" }
  }

  const updateData: Record<string, unknown> = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.preconditions !== undefined) updateData.preconditions = data.preconditions
  if (data.test_data !== undefined) updateData.test_data = data.test_data
  if (data.test_steps !== undefined) updateData.test_steps = JSON.stringify(data.test_steps)
  if (data.expected_results !== undefined) updateData.expected_results = data.expected_results
  if (data.test_type !== undefined) updateData.test_type = data.test_type
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.status !== undefined) updateData.status = data.status

  const { error } = await supabase
    .from("test_cases")
    .update(updateData as never)
    .eq("test_case_id", testCaseId)

  if (error) {
    console.error("Error updating test case:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/test-cases")
  revalidatePath(`/uat/test-cases/${testCaseId}`)
  revalidatePath("/uat")
  return { success: true }
}

export async function archiveTestCase(testCaseId: string) {
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

  if (!userData || !["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to archive test cases" }
  }

  const { error } = await supabase
    .from("test_cases")
    .update({ is_archived: true, status: "deprecated" } as never)
    .eq("test_case_id", testCaseId)

  if (error) {
    console.error("Error archiving test case:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/test-cases")
  revalidatePath("/uat")
  return { success: true }
}

export async function reviewTestCase(testCaseId: string) {
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

  if (!userData || !["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to review test cases" }
  }

  const { error } = await supabase
    .from("test_cases")
    .update({
      human_reviewed: true,
      reviewed_by: userData.user_id,
      reviewed_at: new Date().toISOString(),
      status: "ready",
    } as never)
    .eq("test_case_id", testCaseId)

  if (error) {
    console.error("Error reviewing test case:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/test-cases")
  revalidatePath(`/uat/test-cases/${testCaseId}`)
  return { success: true }
}

// ============================================================================
// Test Case Query Actions
// ============================================================================

interface TestCaseRow {
  test_case_id: string
  story_id: string
  program_id: string
  title: string
  description: string | null
  preconditions: string | null
  test_data: string | null
  test_steps: TestStep[]
  expected_results: string | null
  test_type: string
  priority: string
  is_ai_generated: boolean
  ai_model_used: string | null
  human_reviewed: boolean
  reviewed_by: string | null
  reviewed_at: string | null
  status: TestCaseStatus
  version: number
  created_at: string
  updated_at: string
  created_by: string
  is_archived: boolean
}

export async function getTestCasesForStory(storyId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: testCases, error } = await supabase
    .from("test_cases")
    .select("*")
    .eq("story_id", storyId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true }) as { data: TestCaseRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching test cases:", error)
    return { success: false, error: error.message }
  }

  return { success: true, testCases: testCases || [] }
}

export async function getAllTestCases(filters?: {
  programId?: string
  status?: string
  testType?: string
  search?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  let query = supabase
    .from("test_cases")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })

  if (filters?.programId) {
    query = query.eq("program_id", filters.programId)
  }
  if (filters?.status) {
    query = query.eq("status", filters.status)
  }
  if (filters?.testType) {
    query = query.eq("test_type", filters.testType)
  }
  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`)
  }

  const { data: testCases, error } = await query as { data: TestCaseRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching test cases:", error)
    return { success: false, error: error.message }
  }

  return { success: true, testCases: testCases || [] }
}

export async function getTestCaseById(testCaseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: testCase, error } = await supabase
    .from("test_cases")
    .select("*")
    .eq("test_case_id", testCaseId)
    .single() as { data: TestCaseRow | null; error: Error | null }

  if (error) {
    console.error("Error fetching test case:", error)
    return { success: false, error: error.message }
  }

  return { success: true, testCase }
}
