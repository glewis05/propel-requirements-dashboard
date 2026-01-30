"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/database"

type CommentUpdate = Database['public']['Tables']['story_comments']['Update']

export interface QuestionWithDetails {
  id: string
  story_id: string
  story_title: string
  program_id: string
  user_id: string
  user_name: string
  content: string
  resolved: boolean
  created_at: string
  answer_count: number
  accepted_answer_id: string | null
}

interface CommentRow {
  id: string
  story_id: string
  user_id: string
  content: string
  is_question: boolean
  resolved: boolean
  created_at: string
}

interface StoryRow {
  story_id: string
  title: string
  program_id: string
}

interface UserRow {
  user_id: string
  name: string
}

interface AnswerCountRow {
  parent_comment_id: string
  count: number
}

interface AcceptedAnswerRow {
  parent_comment_id: string
  id: string
}

export async function getOpenQuestions(): Promise<{
  success: boolean
  questions?: QuestionWithDetails[]
  error?: string
}> {
  const supabase = await createClient()

  // Fetch all questions (comments marked as is_question = true)
  const { data: questions, error } = await supabase
    .from("story_comments")
    .select("id, story_id, user_id, content, is_question, resolved, created_at")
    .eq("is_question", true)
    .is("parent_comment_id", null) // Only top-level questions
    .order("created_at", { ascending: false }) as { data: CommentRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching questions:", error)
    return { success: false, error: error.message }
  }

  if (!questions || questions.length === 0) {
    return { success: true, questions: [] }
  }

  // Get unique story IDs and user IDs
  const storyIds = Array.from(new Set(questions.map(q => q.story_id)))
  const userIds = Array.from(new Set(questions.map(q => q.user_id)))
  const questionIds = questions.map(q => q.id)

  // Fetch story details
  const { data: stories } = await supabase
    .from("user_stories")
    .select("story_id, title, program_id")
    .in("story_id", storyIds) as { data: StoryRow[] | null; error: Error | null }

  const storyMap = new Map(stories?.map(s => [s.story_id, s]) || [])

  // Fetch user names
  const { data: users } = await supabase
    .from("users")
    .select("user_id, name")
    .in("user_id", userIds) as { data: UserRow[] | null; error: Error | null }

  const userMap = new Map(users?.map(u => [u.user_id, u.name]) || [])

  // Count answers for each question
  const { data: answerCounts } = await supabase
    .from("story_comments")
    .select("parent_comment_id")
    .in("parent_comment_id", questionIds) as { data: { parent_comment_id: string }[] | null; error: Error | null }

  const answerCountMap = new Map<string, number>()
  answerCounts?.forEach(a => {
    const current = answerCountMap.get(a.parent_comment_id) || 0
    answerCountMap.set(a.parent_comment_id, current + 1)
  })

  // Find accepted answers
  const { data: acceptedAnswers } = await supabase
    .from("story_comments")
    .select("parent_comment_id, id")
    .in("parent_comment_id", questionIds)
    .eq("accepted_answer", true) as { data: AcceptedAnswerRow[] | null; error: Error | null }

  const acceptedAnswerMap = new Map(acceptedAnswers?.map(a => [a.parent_comment_id, a.id]) || [])

  // Combine data
  const questionsWithDetails: QuestionWithDetails[] = questions.map(question => {
    const story = storyMap.get(question.story_id)
    return {
      id: question.id,
      story_id: question.story_id,
      story_title: story?.title || "Unknown Story",
      program_id: story?.program_id || "",
      user_id: question.user_id,
      user_name: userMap.get(question.user_id) || "Unknown User",
      content: question.content,
      resolved: question.resolved,
      created_at: question.created_at,
      answer_count: answerCountMap.get(question.id) || 0,
      accepted_answer_id: acceptedAnswerMap.get(question.id) || null,
    }
  })

  return { success: true, questions: questionsWithDetails }
}

export async function acceptAnswer(
  commentId: string,
  questionId: string,
  storyId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user's internal ID
  const { data: userData } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_id", user.id)
    .single() as { data: { user_id: string } | null; error: Error | null }

  if (!userData) {
    return { success: false, error: "User profile not found" }
  }

  // First, unmark any previously accepted answers for this question
  const unmarkUpdate: CommentUpdate = {
    accepted_answer: false,
    accepted_at: null,
    accepted_by: null,
  }
  await supabase
    .from("story_comments")
    .update(unmarkUpdate)
    .eq("parent_comment_id", questionId)
    .eq("accepted_answer", true)

  // Mark this answer as accepted
  const acceptUpdate: CommentUpdate = {
    accepted_answer: true,
    accepted_at: new Date().toISOString(),
    accepted_by: userData.user_id,
  }
  const { error } = await supabase
    .from("story_comments")
    .update(acceptUpdate)
    .eq("id", commentId)

  if (error) {
    console.error("Error accepting answer:", error)
    return { success: false, error: error.message }
  }

  // Also mark the question as resolved
  const resolveUpdate: CommentUpdate = { resolved: true, updated_at: new Date().toISOString() }
  await supabase
    .from("story_comments")
    .update(resolveUpdate)
    .eq("id", questionId)

  revalidatePath(`/stories/${storyId}`)
  revalidatePath("/questions")

  return { success: true }
}

export async function unacceptAnswer(
  commentId: string,
  questionId: string,
  storyId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Unmark the answer
  const unacceptUpdate: CommentUpdate = {
    accepted_answer: false,
    accepted_at: null,
    accepted_by: null,
  }
  const { error } = await supabase
    .from("story_comments")
    .update(unacceptUpdate)
    .eq("id", commentId)

  if (error) {
    console.error("Error unaccepting answer:", error)
    return { success: false, error: error.message }
  }

  // Unmark the question as resolved (since there's no accepted answer now)
  const unresolveUpdate: CommentUpdate = { resolved: false, updated_at: new Date().toISOString() }
  await supabase
    .from("story_comments")
    .update(unresolveUpdate)
    .eq("id", questionId)

  revalidatePath(`/stories/${storyId}`)
  revalidatePath("/questions")

  return { success: true }
}
