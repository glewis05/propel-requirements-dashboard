"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendMentionNotifications } from "@/lib/notifications/service"
import type { Database } from "@/types/database"

type CommentInsert = Database['public']['Tables']['story_comments']['Insert']
type CommentUpdate = Database['public']['Tables']['story_comments']['Update']

interface UserData {
  user_id: string
  name: string
}

interface StoryData {
  title: string
}

interface CommentData {
  id: string
  story_id: string
  user_id: string
  content: string
  is_question: boolean
  resolved: boolean
  parent_comment_id: string | null
  created_at: string
  updated_at: string
}

export async function createComment(
  storyId: string,
  content: string,
  isQuestion: boolean = false,
  parentCommentId?: string,
  mentionedUserIds?: string[]
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
    .single() as { data: UserData | null; error: Error | null }

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
  const insertData: CommentInsert = {
    story_id: storyId,
    user_id: userData.user_id,
    content: content.trim(),
    is_question: isQuestion,
    parent_comment_id: parentCommentId || null,
  }
  const { data: comment, error } = await supabase
    .from("story_comments")
    .insert(insertData)
    .select()
    .single() as { data: CommentData | null; error: Error | null }

  if (error) {
    console.error("Error creating comment:", error)
    return { success: false, error: error.message }
  }

  // Send mention notifications if there are mentioned users
  if (mentionedUserIds && mentionedUserIds.length > 0 && comment) {
    // Get story title for the notification
    const { data: story } = await supabase
      .from("stories")
      .select("title")
      .eq("id", storyId)
      .single() as { data: StoryData | null; error: unknown }

    // Send notifications asynchronously (don't wait)
    sendMentionNotifications({
      storyId,
      storyTitle: story?.title || "Unknown Story",
      commentId: comment.id,
      commentContent: content,
      mentionerName: userData.name,
      mentionedUserIds,
    }).catch((err) => {
      console.error("Failed to send mention notifications:", err)
    })
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

  const updateData: CommentUpdate = { resolved, updated_at: new Date().toISOString() }
  const { error } = await supabase
    .from("story_comments")
    .update(updateData)
    .eq("id", commentId)

  if (error) {
    console.error("Error updating comment:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
