"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createComment(
  storyId: string,
  content: string,
  isQuestion: boolean = false,
  parentCommentId?: string
) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user's internal ID from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("user_id, name")
    .eq("auth_id", user.id)
    .single()

  if (userError || !userData) {
    return { success: false, error: "User profile not found" }
  }

  // Validate content
  if (!content.trim()) {
    return { success: false, error: "Comment cannot be empty" }
  }

  if (content.length > 5000) {
    return { success: false, error: "Comment is too long (max 5000 characters)" }
  }

  // Create comment
  const { data: comment, error } = await supabase
    .from("story_comments")
    .insert({
      story_id: storyId,
      user_id: userData.user_id,
      content: content.trim(),
      is_question: isQuestion,
      parent_comment_id: parentCommentId || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating comment:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/stories/${storyId}`)
  return { success: true, comment, userName: userData.name }
}

export async function resolveComment(commentId: string, resolved: boolean) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("story_comments")
    .update({ resolved, updated_at: new Date().toISOString() })
    .eq("id", commentId)

  if (error) {
    console.error("Error updating comment:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
