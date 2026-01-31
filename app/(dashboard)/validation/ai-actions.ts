"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  TestCaseService,
  NotificationService,
  getTestCaseGenerator,
} from "@/lib/services"
import { isFeatureEnabled } from "@/lib/config"
import type { GeneratedTestCase } from "@/lib/ai/types"

/**
 * Build a description string from story components
 */
function buildStoryDescription(story: {
  user_story: string | null
  role: string | null
  capability: string | null
  benefit: string | null
}): string {
  if (story.role && story.capability && story.benefit) {
    return `As a ${story.role}, I want to ${story.capability}, so that ${story.benefit}`
  }
  return story.user_story || ""
}

/**
 * Generate test cases for a story (manual trigger from UI)
 */
export async function generateTestCases(storyId: string) {
  const supabase = await createClient()

  // Auth check
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

  // Role check
  const allowedRoles = ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"]
  if (!allowedRoles.includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to generate test cases" }
  }

  // Check if AI is available
  const generator = getTestCaseGenerator()
  if (!await generator.isAvailable()) {
    return { success: false, error: "AI test generation is not available" }
  }

  // Fetch story details
  const { data: story, error: storyError } = await supabase
    .from("user_stories")
    .select("story_id, title, user_story, role, capability, benefit, acceptance_criteria, category, program_id")
    .eq("story_id", storyId)
    .is("deleted_at", null)
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

  // Generate using service
  const result = await generator.generate({
    title: story.title,
    description: buildStoryDescription(story),
    acceptanceCriteria: story.acceptance_criteria || undefined,
    programName: program?.name || undefined,
    category: story.category || undefined,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || "Failed to generate test cases" }
  }

  return { success: true, testCases: result.data }
}

/**
 * Save generated test cases (manual save from UI)
 */
export async function saveGeneratedTestCases(
  storyId: string,
  programId: string,
  testCases: GeneratedTestCase[]
) {
  const supabase = await createClient()

  // Auth check
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

  // Role check
  const allowedRoles = ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"]
  if (!allowedRoles.includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to save test cases" }
  }

  // Use service to save
  const testCaseService = new TestCaseService(supabase)
  const result = await testCaseService.saveGeneratedTestCases(
    storyId,
    programId,
    testCases,
    userData.user_id
  )

  if (!result.success) {
    return { success: false, error: result.error }
  }

  revalidatePath("/validation/test-cases")
  revalidatePath("/validation")
  return { success: true, count: result.data?.count || 0 }
}

/**
 * Auto-generate test cases for a story when it moves to Approved status.
 *
 * This function:
 * 1. Checks if the feature is enabled
 * 2. Checks if story already has test cases (skips if yes)
 * 3. Generates test cases using AI
 * 4. Saves them and notifies the user
 *
 * Called from transitionStoryStatus - auth already verified by caller.
 */
export async function autoGenerateTestCasesForStory(
  storyId: string,
  programId: string,
  triggeredByUserId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  // Check feature flag
  if (!isFeatureEnabled('autoGenerateTestCases')) {
    return { success: true, count: 0 } // Silent skip if disabled
  }

  const supabase = await createClient()
  const testCaseService = new TestCaseService(supabase)
  const notificationService = new NotificationService(supabase)
  const generator = getTestCaseGenerator()

  // Check if AI is available
  if (!await generator.isAvailable()) {
    console.log(`Auto-generation skipped for ${storyId}: AI not available`)
    return { success: true, count: 0 }
  }

  // Check if story already has test cases
  const hasTestsResult = await testCaseService.hasTestCases(storyId)
  if (!hasTestsResult.success) {
    return { success: false, count: 0, error: hasTestsResult.error }
  }
  if (hasTestsResult.data) {
    // Story already has test cases, skip generation
    return { success: true, count: 0 }
  }

  // Fetch story details
  const { data: story, error: storyError } = await supabase
    .from("user_stories")
    .select("story_id, title, user_story, role, capability, benefit, acceptance_criteria, category, program_id")
    .eq("story_id", storyId)
    .single()

  if (storyError || !story) {
    return { success: false, count: 0, error: "Story not found" }
  }

  // Get program name
  const { data: program } = await supabase
    .from("programs")
    .select("name")
    .eq("program_id", story.program_id)
    .single()

  // Generate test cases
  const generateResult = await generator.generate({
    title: story.title,
    description: buildStoryDescription(story),
    acceptanceCriteria: story.acceptance_criteria || undefined,
    programName: program?.name || undefined,
    category: story.category || undefined,
  })

  if (!generateResult.success || !generateResult.data) {
    return { success: false, count: 0, error: generateResult.error || "Failed to generate test cases" }
  }

  const testCases = generateResult.data

  // Save test cases
  const saveResult = await testCaseService.saveGeneratedTestCases(
    storyId,
    programId,
    testCases,
    triggeredByUserId
  )

  if (!saveResult.success) {
    return { success: false, count: 0, error: saveResult.error }
  }

  // Mark story as auto-generated
  await testCaseService.markAutoGenerated(storyId)

  // Create notification for the user
  await notificationService.createNotification({
    userId: triggeredByUserId,
    title: "Test Cases Generated",
    message: `${testCases.length} AI test cases have been auto-generated for "${story.title}"`,
    type: "test_case_generated",
    storyId,
  })

  // Revalidate paths
  revalidatePath("/validation/test-cases")
  revalidatePath("/validation")
  revalidatePath(`/stories/${storyId}`)

  return { success: true, count: testCases.length }
}
