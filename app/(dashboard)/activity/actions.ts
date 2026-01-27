"use server"

import { createClient } from "@/lib/supabase/server"
import type { ActivityType } from "@/types/database"

export interface ActivityWithDetails {
  id: string
  activity_type: ActivityType
  user_id: string
  user_name: string
  story_id: string | null
  story_title: string | null
  comment_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface ActivityRow {
  id: string
  activity_type: ActivityType
  user_id: string
  story_id: string | null
  comment_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface UserRow {
  user_id: string
  name: string
}

interface StoryRow {
  story_id: string
  title: string
}

export async function getRecentActivities(limit: number = 50): Promise<{
  success: boolean
  activities?: ActivityWithDetails[]
  error?: string
}> {
  const supabase = await createClient()

  // Fetch activities
  const { data: activities, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit) as { data: ActivityRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching activities:", error)
    return { success: false, error: error.message }
  }

  if (!activities || activities.length === 0) {
    return { success: true, activities: [] }
  }

  // Get unique user IDs and story IDs
  const userIds = Array.from(new Set(activities.map(a => a.user_id)))
  const storyIds = Array.from(new Set(activities.map(a => a.story_id).filter(Boolean))) as string[]

  // Fetch user names
  const { data: users } = await supabase
    .from("users")
    .select("user_id, name")
    .in("user_id", userIds) as { data: UserRow[] | null; error: Error | null }

  const userMap = new Map(users?.map(u => [u.user_id, u.name]) || [])

  // Fetch story titles
  let storyMap = new Map<string, string>()
  if (storyIds.length > 0) {
    const { data: stories } = await supabase
      .from("user_stories")
      .select("story_id, title")
      .in("story_id", storyIds) as { data: StoryRow[] | null; error: Error | null }

    storyMap = new Map(stories?.map(s => [s.story_id, s.title]) || [])
  }

  // Combine data
  const activitiesWithDetails: ActivityWithDetails[] = activities.map(activity => ({
    id: activity.id,
    activity_type: activity.activity_type,
    user_id: activity.user_id,
    user_name: userMap.get(activity.user_id) || "Unknown User",
    story_id: activity.story_id,
    story_title: activity.story_id ? storyMap.get(activity.story_id) || null : null,
    comment_id: activity.comment_id,
    metadata: activity.metadata || {},
    created_at: activity.created_at,
  }))

  return { success: true, activities: activitiesWithDetails }
}

export async function logActivity(
  activityType: ActivityType,
  storyId?: string,
  commentId?: string,
  metadata?: Record<string, unknown>
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

  // Insert activity
  const { error } = await supabase
    .from("activity_log")
    .insert({
      activity_type: activityType,
      user_id: userData.user_id,
      story_id: storyId || null,
      comment_id: commentId || null,
      metadata: metadata || {},
    } as never)

  if (error) {
    console.error("Error logging activity:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
