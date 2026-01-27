"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { StoryFormData } from "@/lib/validations/story"
import type { StoryStatus, ApprovalType, ApprovalStatus } from "@/types/database"
import { canTransition, STATUS_CONFIG } from "@/lib/status-transitions"

function generateStoryId(programId: string): string {
  // Generate a unique story ID: PROG-YYYYMMDD-XXXX
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const prefix = programId.slice(0, 4).toUpperCase()
  return `${prefix}-${dateStr}-${random}`
}

export async function createStory(data: StoryFormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const storyId = generateStoryId(data.program_id)

  // Prepare story data
  const storyData = {
    story_id: storyId,
    title: data.title,
    program_id: data.program_id,
    status: data.status,
    priority: data.priority || null,
    user_story: data.user_story || null,
    role: data.role || null,
    capability: data.capability || null,
    benefit: data.benefit || null,
    acceptance_criteria: data.acceptance_criteria || null,
    success_metrics: data.success_metrics || null,
    category: data.category || null,
    category_full: data.category_full || null,
    is_technical: data.is_technical,
    roadmap_target: data.roadmap_target || null,
    internal_notes: data.internal_notes || null,
    meeting_context: data.meeting_context || null,
    client_feedback: data.client_feedback || null,
    requirement_id: data.requirement_id || null,
    parent_story_id: data.parent_story_id || null,
    related_stories: data.related_stories || [],
    version: 1,
    draft_date: data.status === "Draft" ? new Date().toISOString() : null,
    internal_review_date: data.status === "Internal Review" ? new Date().toISOString() : null,
    client_review_date: data.status === "Pending Client Review" ? new Date().toISOString() : null,
    needs_discussion_date: data.status === "Needs Discussion" ? new Date().toISOString() : null,
  }

  const { error } = await supabase
    .from("user_stories")
    .insert(storyData)

  if (error) {
    console.error("Error creating story:", error)

    // If the error is from the story_versions trigger, the transaction rolled back
    // User needs to fix the trigger in Supabase - it should be AFTER INSERT, not BEFORE
    if (error.message.includes("story_versions")) {
      return {
        success: false,
        error: "Database trigger error. Please go to Supabase → Database → Triggers and change the story_versions trigger from BEFORE INSERT to AFTER INSERT on the user_stories table."
      }
    }
    return { success: false, error: error.message }
  }

  // Create initial version record (only if story insert succeeded)
  await supabase
    .from("story_versions")
    .insert({
      story_id: storyId,
      version_number: 1,
      snapshot: storyData,
      change_summary: "Initial creation",
      changed_by: user.id,
      is_baseline: false,
    })
    .then(() => {})
    .catch((err) => console.error("Version creation failed:", err))

  revalidatePath("/stories")
  return { success: true, storyId }
}

export async function updateStory(storyId: string, data: StoryFormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Fetch current story to get version
  const { data: currentStory, error: fetchError } = await supabase
    .from("user_stories")
    .select("version, status")
    .eq("story_id", storyId)
    .single()

  if (fetchError || !currentStory) {
    return { success: false, error: "Story not found" }
  }

  // Prepare update data
  const updateData = {
    title: data.title,
    program_id: data.program_id,
    status: data.status,
    priority: data.priority || null,
    user_story: data.user_story || null,
    role: data.role || null,
    capability: data.capability || null,
    benefit: data.benefit || null,
    acceptance_criteria: data.acceptance_criteria || null,
    success_metrics: data.success_metrics || null,
    category: data.category || null,
    category_full: data.category_full || null,
    is_technical: data.is_technical,
    roadmap_target: data.roadmap_target || null,
    internal_notes: data.internal_notes || null,
    meeting_context: data.meeting_context || null,
    client_feedback: data.client_feedback || null,
    parent_story_id: data.parent_story_id || null,
    related_stories: data.related_stories || [],
    updated_at: new Date().toISOString(),
    version: currentStory.version + 1,
    // Update status dates if status changed
    ...(data.status !== currentStory.status && {
      draft_date: data.status === "Draft" ? new Date().toISOString() : undefined,
      internal_review_date: data.status === "Internal Review" ? new Date().toISOString() : undefined,
      client_review_date: data.status === "Pending Client Review" ? new Date().toISOString() : undefined,
      needs_discussion_date: data.status === "Needs Discussion" ? new Date().toISOString() : undefined,
    }),
  }

  const { error } = await supabase
    .from("user_stories")
    .update(updateData)
    .eq("story_id", storyId)

  if (error) {
    console.error("Error updating story:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/stories")
  revalidatePath(`/stories/${storyId}`)
  return { success: true, storyId }
}

export async function deleteStory(storyId: string) {
  const supabase = await createClient()

  // Get current user and verify permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single()

  // Only Admin can delete stories
  if (userData?.role !== "Admin") {
    return { success: false, error: "Only administrators can delete stories" }
  }

  // Check if story is protected (client-approved and in development/UAT)
  const { data: story } = await supabase
    .from("user_stories")
    .select("status, stakeholder_approved_at")
    .eq("story_id", storyId)
    .single()

  if (story?.stakeholder_approved_at &&
      ["Approved", "In Development", "In UAT"].includes(story.status)) {
    return {
      success: false,
      error: "Cannot delete stories that have been client-approved and are in Approved, Development, or UAT status"
    }
  }

  // Clear parent_story_id on any child stories (orphan them)
  await supabase
    .from("user_stories")
    .update({ parent_story_id: null })
    .eq("parent_story_id", storyId)

  // Remove this story from all related_stories arrays
  await supabase.rpc("remove_story_from_related", { p_story_id: storyId })

  // Delete related records (comments, approvals, versions)
  await supabase.from("story_comments").delete().eq("story_id", storyId)
  await supabase.from("story_approvals").delete().eq("story_id", storyId)
  await supabase.from("story_versions").delete().eq("story_id", storyId)

  // Delete the story
  const { error } = await supabase
    .from("user_stories")
    .delete()
    .eq("story_id", storyId)

  if (error) {
    console.error("Error deleting story:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/stories")
  return { success: true }
}

export async function acquireStoryLock(storyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("acquire_story_lock", {
    p_story_id: storyId,
  })

  if (error) {
    console.error("Error acquiring lock:", error)
    return { success: false, error: error.message }
  }

  return { success: data === true, locked: data === true }
}

export async function releaseStoryLock(storyId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc("release_story_lock", {
    p_story_id: storyId,
  })

  if (error) {
    console.error("Error releasing lock:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function checkStoryLock(storyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("is_story_locked", {
    p_story_id: storyId,
  })

  if (error) {
    console.error("Error checking lock:", error)
    return { isLocked: false, lockedByName: null, lockedSince: null }
  }

  if (data && data.length > 0) {
    return {
      isLocked: data[0].is_locked,
      lockedByName: data[0].locked_by_name,
      lockedSince: data[0].locked_since,
    }
  }

  return { isLocked: false, lockedByName: null, lockedSince: null }
}

export async function transitionStoryStatus(
  storyId: string,
  newStatus: StoryStatus,
  notes?: string
) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user details including role
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  // Fetch current story
  const { data: story, error: fetchError } = await supabase
    .from("user_stories")
    .select("status, version, stakeholder_approved_at")
    .eq("story_id", storyId)
    .single()

  if (fetchError || !story) {
    return { success: false, error: "Story not found" }
  }

  const currentStatus = story.status as StoryStatus

  // Validate transition is allowed
  if (!canTransition(currentStatus, newStatus, userData.role)) {
    return { success: false, error: "This status transition is not allowed" }
  }

  // Get transition config to check if it requires approval
  const statusConfig = STATUS_CONFIG[currentStatus]
  const transition = statusConfig?.allowedTransitions.find(t => t.to === newStatus)

  // Prepare update data
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
    version: story.version + 1,
  }

  // Set status-specific date fields
  const now = new Date().toISOString()
  if (newStatus === "Draft") {
    updateData.draft_date = now
  } else if (newStatus === "Internal Review") {
    updateData.internal_review_date = now
  } else if (newStatus === "Pending Client Review") {
    updateData.client_review_date = now
  } else if (newStatus === "Needs Discussion") {
    updateData.needs_discussion_date = now
  } else if (newStatus === "Approved") {
    updateData.approved_at = now
    updateData.approved_by = userData.user_id
  }

  // If this is a stakeholder approval, set stakeholder fields
  if (transition?.approvalType === "stakeholder") {
    updateData.stakeholder_approved_at = now
    updateData.stakeholder_approved_by = userData.user_id
  }

  // Update the story
  const { error: updateError } = await supabase
    .from("user_stories")
    .update(updateData)
    .eq("story_id", storyId)

  if (updateError) {
    console.error("Error updating story status:", updateError)
    return { success: false, error: updateError.message }
  }

  // If this transition requires approval, create an approval record
  if (transition?.requiresApproval && transition.approvalType) {
    const approvalStatus: ApprovalStatus = "approved"

    const { error: approvalError } = await supabase
      .from("story_approvals")
      .insert({
        story_id: storyId,
        approved_by: userData.user_id,
        approval_type: transition.approvalType as ApprovalType,
        status: approvalStatus,
        previous_status: currentStatus,
        notes: notes || null,
      })

    if (approvalError) {
      console.error("Error creating approval record:", approvalError)
      // Don't fail the whole operation, just log the error
    }
  }

  // Always create a version record for status changes with notes
  if (notes) {
    await supabase
      .from("story_versions")
      .insert({
        story_id: storyId,
        version_number: story.version + 1,
        snapshot: { ...story, status: newStatus },
        change_summary: `Status changed from ${currentStatus} to ${newStatus}: ${notes}`,
        changed_by: user.id,
        changed_fields: ["status"],
      })
      .then(() => {})
      .catch((err) => console.error("Version creation failed:", err))
  }

  revalidatePath("/stories")
  revalidatePath(`/stories/${storyId}`)
  revalidatePath("/approvals")
  revalidatePath("/dashboard")

  return { success: true }
}
