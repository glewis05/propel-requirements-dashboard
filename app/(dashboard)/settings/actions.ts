"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { NotificationPreferences } from "@/types/database"

export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
) {
  const supabase = await createClient()

  // Get current user and verify they're updating their own preferences
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Verify user is updating their own preferences
  const { data: userData } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_id", user.id)
    .single()

  if (!userData || userData.user_id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  // Update preferences
  const { error } = await supabase
    .from("users")
    .update({
      notification_preferences: preferences,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) {
    console.error("Error updating notification preferences:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/settings/notifications")
  return { success: true }
}
