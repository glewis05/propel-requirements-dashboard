"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  RuleUpdateStoryFormData,
  RuleTestCaseFormData,
  UpdateRuleDetailsFormData,
} from "@/lib/validations/rule-update"
import type {
  RuleUpdateDetails,
  RuleTestCase,
  RuleUpdateHistoryEntry,
  Platform,
  TestType,
} from "@/types/rule-update"
import { extractRuleCode } from "@/lib/validations/rule-update"

function generateStoryId(programId: string): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const prefix = programId.slice(0, 4).toUpperCase()
  return `${prefix}-${dateStr}-${random}`
}

// Create a new rule update story with details and optional test cases
export async function createRuleUpdateStory(data: RuleUpdateStoryFormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user details
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, name")
    .eq("auth_id", user.id)
    .single()

  const storyId = generateStoryId(data.program_id)

  // Create the base story
  const storyData = {
    story_id: storyId,
    title: data.title,
    program_id: data.program_id,
    status: data.status,
    priority: data.priority || null,
    story_type: "rule_update" as const,
    version: 1,
    draft_date: data.status === "Draft" ? new Date().toISOString() : null,
    internal_review_date: data.status === "Internal Review" ? new Date().toISOString() : null,
    client_review_date: data.status === "Pending Client Review" ? new Date().toISOString() : null,
    needs_discussion_date: data.status === "Needs Discussion" ? new Date().toISOString() : null,
  }

  const { error: storyError } = await supabase
    .from("user_stories")
    .insert(storyData)

  if (storyError) {
    console.error("Error creating rule update story:", storyError)
    return { success: false, error: storyError.message }
  }

  // Create rule update details
  const detailsData = {
    story_id: storyId,
    rule_type: data.rule_details.rule_type,
    target_rule: data.rule_details.target_rule,
    change_id: data.rule_details.change_id,
    change_type: data.rule_details.change_type,
    quarter: data.rule_details.quarter,
    effective_date: data.rule_details.effective_date || null,
    rule_description: data.rule_details.rule_description || null,
    change_summary: data.rule_details.change_summary || null,
  }

  const { error: detailsError } = await supabase
    .from("rule_update_details")
    .insert(detailsData)

  if (detailsError) {
    console.error("Error creating rule update details:", detailsError)
    // Rollback: delete the story
    await supabase.from("user_stories").delete().eq("story_id", storyId)
    return { success: false, error: detailsError.message }
  }

  // Create test cases if provided
  if (data.test_cases && data.test_cases.length > 0) {
    for (const testCase of data.test_cases) {
      const result = await addRuleTestCase(storyId, testCase)
      if (!result.success) {
        console.error("Error creating test case:", result.error)
        // Continue with other test cases
      }
    }
  }

  // Log history
  await supabase.from("rule_update_history").insert({
    story_id: storyId,
    action: "created",
    new_data: { story: storyData, details: detailsData },
    changed_by: user.id,
    changed_by_name: userData?.name || null,
  })

  // Create initial version record
  await supabase
    .from("story_versions")
    .insert({
      story_id: storyId,
      version_number: 1,
      snapshot: { ...storyData, rule_details: detailsData },
      change_summary: "Initial creation (Rule Update)",
      changed_by: user.id,
      is_baseline: false,
    })
    .catch((err) => console.error("Version creation failed:", err))

  revalidatePath("/stories")
  return { success: true, storyId }
}

// Update rule update details
export async function updateRuleUpdateDetails(
  storyId: string,
  data: UpdateRuleDetailsFormData
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, name")
    .eq("auth_id", user.id)
    .single()

  // Get current details for history
  const { data: currentDetails } = await supabase
    .from("rule_update_details")
    .select("*")
    .eq("story_id", storyId)
    .single()

  if (!currentDetails) {
    return { success: false, error: "Rule update details not found" }
  }

  // Update details
  const { error } = await supabase
    .from("rule_update_details")
    .update(data)
    .eq("story_id", storyId)

  if (error) {
    console.error("Error updating rule update details:", error)
    return { success: false, error: error.message }
  }

  // Log history
  await supabase.from("rule_update_history").insert({
    story_id: storyId,
    action: "details_updated",
    previous_data: currentDetails,
    new_data: { ...currentDetails, ...data },
    changed_by: user.id,
    changed_by_name: userData?.name || null,
  })

  // Increment story version
  await supabase
    .from("user_stories")
    .update({ version: (currentDetails as unknown as { version?: number }).version ?? 1 + 1 })
    .eq("story_id", storyId)

  revalidatePath("/stories")
  revalidatePath(`/stories/${storyId}`)
  return { success: true }
}

// Get rule update details for a story
export async function getRuleUpdateDetails(storyId: string): Promise<{
  success: boolean
  data?: RuleUpdateDetails
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rule_update_details")
    .select("*")
    .eq("story_id", storyId)
    .single()

  if (error) {
    console.error("Error fetching rule update details:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as RuleUpdateDetails }
}

// Get all test cases for a story
export async function getRuleTestCases(storyId: string): Promise<{
  success: boolean
  data?: RuleTestCase[]
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rule_update_test_cases")
    .select("*")
    .eq("story_id", storyId)
    .order("platform")
    .order("test_type")
    .order("sequence_number")

  if (error) {
    console.error("Error fetching rule test cases:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as RuleTestCase[] }
}

// Generate profile ID using database function
export async function generateProfileId(
  storyId: string,
  platform: Platform,
  testType: TestType
): Promise<{ success: boolean; profileId?: string; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("generate_rule_test_profile_id", {
    p_story_id: storyId,
    p_platform: platform,
    p_test_type: testType,
  })

  if (error) {
    console.error("Error generating profile ID:", error)
    return { success: false, error: error.message }
  }

  return { success: true, profileId: data as string }
}

// Get next sequence number for preview
export async function getNextTestSequence(
  storyId: string,
  platform: Platform,
  testType: TestType
): Promise<{ success: boolean; sequence?: number; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_next_test_sequence", {
    p_story_id: storyId,
    p_platform: platform,
    p_test_type: testType,
  })

  if (error) {
    console.error("Error getting next sequence:", error)
    return { success: false, error: error.message }
  }

  return { success: true, sequence: data as number }
}

// Add a new test case
export async function addRuleTestCase(
  storyId: string,
  data: RuleTestCaseFormData
): Promise<{ success: boolean; testId?: string; profileId?: string; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, name")
    .eq("auth_id", user.id)
    .single()

  // Generate profile ID
  const profileResult = await generateProfileId(storyId, data.platform, data.test_type)
  if (!profileResult.success || !profileResult.profileId) {
    return { success: false, error: profileResult.error || "Failed to generate profile ID" }
  }

  // Get sequence number
  const seqResult = await getNextTestSequence(storyId, data.platform, data.test_type)
  if (!seqResult.success) {
    return { success: false, error: seqResult.error || "Failed to get sequence number" }
  }

  const testCaseData = {
    story_id: storyId,
    profile_id: profileResult.profileId,
    platform: data.platform,
    test_type: data.test_type,
    sequence_number: seqResult.sequence || 1,
    patient_conditions: data.patient_conditions || {},
    expected_result: data.expected_result || null,
    cross_trigger_check: data.cross_trigger_check || null,
    test_steps: data.test_steps || [],
    status: data.status || "draft",
  }

  const { data: insertedData, error } = await supabase
    .from("rule_update_test_cases")
    .insert(testCaseData)
    .select("test_id")
    .single()

  if (error) {
    console.error("Error adding test case:", error)
    return { success: false, error: error.message }
  }

  // Log history
  await supabase.from("rule_update_history").insert({
    story_id: storyId,
    test_id: insertedData.test_id,
    action: "test_added",
    new_data: testCaseData,
    changed_by: user.id,
    changed_by_name: userData?.name || null,
  })

  revalidatePath(`/stories/${storyId}`)
  return {
    success: true,
    testId: insertedData.test_id,
    profileId: profileResult.profileId,
  }
}

// Update a test case
export async function updateRuleTestCase(
  testId: string,
  data: Partial<RuleTestCaseFormData>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, name")
    .eq("auth_id", user.id)
    .single()

  // Get current test case for history
  const { data: currentTestCase } = await supabase
    .from("rule_update_test_cases")
    .select("*")
    .eq("test_id", testId)
    .single()

  if (!currentTestCase) {
    return { success: false, error: "Test case not found" }
  }

  // Update test case
  const { error } = await supabase
    .from("rule_update_test_cases")
    .update(data)
    .eq("test_id", testId)

  if (error) {
    console.error("Error updating test case:", error)
    return { success: false, error: error.message }
  }

  // Log history
  await supabase.from("rule_update_history").insert({
    story_id: currentTestCase.story_id,
    test_id: testId,
    action: "test_modified",
    previous_data: currentTestCase,
    new_data: { ...currentTestCase, ...data },
    changed_by: user.id,
    changed_by_name: userData?.name || null,
  })

  revalidatePath(`/stories/${currentTestCase.story_id}`)
  return { success: true }
}

// Delete a test case
export async function deleteRuleTestCase(testId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, name")
    .eq("auth_id", user.id)
    .single()

  // Get test case for history
  const { data: testCase } = await supabase
    .from("rule_update_test_cases")
    .select("*")
    .eq("test_id", testId)
    .single()

  if (!testCase) {
    return { success: false, error: "Test case not found" }
  }

  // Delete the test case
  const { error } = await supabase
    .from("rule_update_test_cases")
    .delete()
    .eq("test_id", testId)

  if (error) {
    console.error("Error deleting test case:", error)
    return { success: false, error: error.message }
  }

  // Log history
  await supabase.from("rule_update_history").insert({
    story_id: testCase.story_id,
    test_id: testId,
    action: "test_deleted",
    previous_data: testCase,
    changed_by: user.id,
    changed_by_name: userData?.name || null,
  })

  revalidatePath(`/stories/${testCase.story_id}`)
  return { success: true }
}

// Get rule update history
export async function getRuleUpdateHistory(
  storyId: string,
  limit: number = 50
): Promise<{
  success: boolean
  data?: RuleUpdateHistoryEntry[]
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rule_update_history")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching rule update history:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as RuleUpdateHistoryEntry[] }
}

// Update rule update story (base story fields)
export async function updateRuleUpdateStory(
  storyId: string,
  data: {
    title?: string
    status?: string
    priority?: string | null
  }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Fetch current story
  const { data: currentStory, error: fetchError } = await supabase
    .from("user_stories")
    .select("version, status")
    .eq("story_id", storyId)
    .single()

  if (fetchError || !currentStory) {
    return { success: false, error: "Story not found" }
  }

  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
    version: currentStory.version + 1,
  }

  const { error } = await supabase
    .from("user_stories")
    .update(updateData)
    .eq("story_id", storyId)

  if (error) {
    console.error("Error updating rule update story:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/stories")
  revalidatePath(`/stories/${storyId}`)
  return { success: true }
}
