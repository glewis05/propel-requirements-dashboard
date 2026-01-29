"use server"

import { createClient } from "@/lib/supabase/server"
import { callClaude, parseJSONResponse } from "@/lib/ai/client"
import { TEST_CASE_GENERATION_SYSTEM_PROMPT, TEST_CASE_GENERATION_USER_PROMPT } from "@/lib/ai/prompts"
import type { GeneratedTestCase } from "@/lib/ai/types"
import type { TestCaseStatus } from "@/types/database"
import { revalidatePath } from "next/cache"

export async function generateTestCases(storyId: string) {
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
    return { success: false, error: "You do not have permission to generate test cases" }
  }

  // Fetch the story details
  const { data: story, error: storyError } = await supabase
    .from("user_stories")
    .select("story_id, title, user_story, role, capability, benefit, acceptance_criteria, category, program_id")
    .eq("story_id", storyId)
    .single()

  if (storyError || !story) {
    return { success: false, error: "Story not found" }
  }

  // Get program name
  const { data: program } = await supabase
    .from("programs")
    .select("name")
    .eq("program_id", story.program_id)
    .single()

  // Build description from story components
  let description = story.user_story || ""
  if (story.role && story.capability && story.benefit) {
    description = `As a ${story.role}, I want to ${story.capability}, so that ${story.benefit}`
  }

  // Generate test cases using Claude
  const result = await callClaude({
    systemPrompt: TEST_CASE_GENERATION_SYSTEM_PROMPT,
    userPrompt: TEST_CASE_GENERATION_USER_PROMPT({
      title: story.title,
      description,
      acceptanceCriteria: story.acceptance_criteria || undefined,
      programName: program?.name || undefined,
      category: story.category || undefined,
    }),
    config: {
      maxTokens: 4096,
      temperature: 0.5,
    },
  })

  if (!result.success || !result.content) {
    return { success: false, error: result.error || "Failed to generate test cases" }
  }

  const testCases = parseJSONResponse<GeneratedTestCase[]>(result.content)
  if (!testCases || !Array.isArray(testCases)) {
    return { success: false, error: "Failed to parse generated test cases" }
  }

  return { success: true, testCases }
}

export async function saveGeneratedTestCases(
  storyId: string,
  programId: string,
  testCases: GeneratedTestCase[]
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
    return { success: false, error: "You do not have permission to save test cases" }
  }

  const insertData = testCases.map(tc => ({
    story_id: storyId,
    program_id: programId,
    title: tc.title,
    description: tc.description,
    preconditions: tc.preconditions,
    test_steps: JSON.stringify(tc.test_steps),
    expected_results: tc.expected_results,
    test_type: tc.test_type,
    priority: tc.priority,
    is_ai_generated: true,
    ai_model_used: "claude-sonnet-4-20250514",
    status: "draft" as TestCaseStatus,
    created_by: userData.user_id,
  }))

  const { error } = await supabase
    .from("test_cases")
    .insert(insertData as never[])

  if (error) {
    console.error("Error saving generated test cases:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/uat/test-cases")
  revalidatePath("/uat")
  return { success: true, count: testCases.length }
}
