"use server"

import { createClient } from "@/lib/supabase/server"
import type { NotificationType } from "@/types/database"

export interface UserNotification {
  id: string
  title: string
  message: string
  notification_type: NotificationType
  story_id: string | null
  comment_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

interface NotificationRow {
  id: string
  user_id: string
  title: string
  message: string
  notification_type: NotificationType
  story_id: string | null
  comment_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export async function getNotifications(limit: number = 20): Promise<{
  success: boolean
  notifications?: UserNotification[]
  unreadCount?: number
  error?: string
}> {
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

  // Fetch notifications
  const { data: notifications, error } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", userData.user_id)
    .order("created_at", { ascending: false })
    .limit(limit) as { data: NotificationRow[] | null; error: Error | null }

  if (error) {
    console.error("Error fetching notifications:", error)
    return { success: false, error: error.message }
  }

  // Count unread
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  return {
    success: true,
    notifications: notifications || [],
    unreadCount,
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("user_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    } as never)
    .eq("id", notificationId)

  if (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function markAllNotificationsAsRead(): Promise<{
  success: boolean
  error?: string
}> {
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

  const { error } = await supabase
    .from("user_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    } as never)
    .eq("user_id", userData.user_id)
    .eq("is_read", false)

  if (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteNotification(notificationId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("user_notifications")
    .delete()
    .eq("id", notificationId)

  if (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Helper function to create a notification (used by other server actions)
export async function createNotification(params: {
  userId: string
  title: string
  message: string
  notificationType: NotificationType
  storyId?: string
  commentId?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("user_notifications")
    .insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      notification_type: params.notificationType,
      story_id: params.storyId || null,
      comment_id: params.commentId || null,
    } as never)

  if (error) {
    console.error("Error creating notification:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
