import { createClient } from "@/lib/supabase/server"
import { sendEmail, generateStatusChangeEmail, generateMentionEmail } from "./email"
import { STATUS_NOTIFICATION_RULES, DEFAULT_NOTIFICATION_PREFERENCES } from "./config"
import type { StoryStatus, UserRole, NotificationPreferences } from "@/types/database"

interface UserBasic {
  name: string
  email: string | null
}

interface UserWithNotificationPrefs {
  user_id: string
  name: string
  email: string | null
  role: UserRole
  assigned_programs: string[] | null
  notification_preferences: NotificationPreferences | null
}

interface MentionedUser {
  user_id: string
  name: string
  email: string | null
  notification_preferences: NotificationPreferences | null
}

interface StatusChangeNotificationParams {
  storyId: string
  storyTitle: string
  programId: string
  previousStatus: StoryStatus
  newStatus: StoryStatus
  changedByUserId: string
  notes?: string
}

export async function sendStatusChangeNotifications(params: StatusChangeNotificationParams) {
  const { storyId, storyTitle, programId, previousStatus, newStatus, changedByUserId, notes } = params

  // Get notification rules for the new status
  const rules = STATUS_NOTIFICATION_RULES[newStatus]
  if (!rules || rules.notifyRoles.length === 0) {
    return { success: true, notified: 0 }
  }

  const supabase = await createClient()

  // Get the user who made the change
  const { data: changedByUser } = await supabase
    .from("users")
    .select("name, email")
    .eq("user_id", changedByUserId)
    .single() as { data: UserBasic | null; error: unknown }

  // Get users to notify based on role and program assignment
  // For Program Managers, also filter by assigned_programs
  const { data: usersToNotify, error } = await supabase
    .from("users")
    .select("user_id, name, email, role, assigned_programs, notification_preferences")
    .in("role", rules.notifyRoles)
    .eq("status", "Active")
    .not("email", "is", null)
    .neq("user_id", changedByUserId) as { data: UserWithNotificationPrefs[] | null; error: Error | null }

  if (error || !usersToNotify) {
    console.error("Error fetching users to notify:", error)
    return { success: false, error: "Failed to fetch users" }
  }

  // Filter users:
  // 1. Check notification preferences (email_enabled and status_changes)
  // 2. For Program Managers, check if they're assigned to this program
  const eligibleUsers = usersToNotify.filter(user => {
    // Check notification preferences
    const prefs = (user.notification_preferences as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES
    if (!prefs.email_enabled || !prefs.status_changes) {
      return false
    }

    // Program Managers should only be notified for their assigned programs
    if (user.role === "Program Manager") {
      const assignedPrograms = user.assigned_programs || []
      if (!assignedPrograms.includes(programId)) {
        return false
      }
    }

    return true
  })

  if (eligibleUsers.length === 0) {
    return { success: true, notified: 0 }
  }

  // Generate email content
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const emailContent = generateStatusChangeEmail({
    storyId,
    storyTitle,
    previousStatus,
    newStatus,
    changedBy: changedByUser?.name || "Unknown",
    notes,
    dashboardUrl,
  })

  // Send emails to all eligible users
  const emailPromises = eligibleUsers.map(async (user) => {
    if (!user.email) return { success: false, userId: user.user_id }

    const result = await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })

    return { ...result, userId: user.user_id }
  })

  const results = await Promise.all(emailPromises)
  const successCount = results.filter(r => r.success).length

  console.log(`Status change notifications sent: ${successCount}/${eligibleUsers.length} emails`)

  return {
    success: true,
    notified: successCount,
    total: eligibleUsers.length,
  }
}

interface MentionNotificationParams {
  storyId: string
  storyTitle: string
  commentId: string
  commentContent: string
  mentionerName: string
  mentionedUserIds: string[]
}

export async function sendMentionNotifications(params: MentionNotificationParams) {
  const { storyId, storyTitle, commentId, commentContent, mentionerName, mentionedUserIds } = params

  if (mentionedUserIds.length === 0) {
    return { success: true, notified: 0 }
  }

  const supabase = await createClient()

  // Get mentioned users with their notification preferences
  const { data: mentionedUsers, error } = await supabase
    .from("users")
    .select("user_id, name, email, notification_preferences")
    .in("user_id", mentionedUserIds)
    .eq("status", "Active")
    .not("email", "is", null) as { data: MentionedUser[] | null; error: Error | null }

  if (error || !mentionedUsers) {
    console.error("Error fetching mentioned users:", error)
    return { success: false, error: "Failed to fetch mentioned users" }
  }

  // Filter users based on notification preferences
  const eligibleUsers = mentionedUsers.filter(user => {
    const prefs = (user.notification_preferences as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES
    return prefs.email_enabled && prefs.mentions
  })

  if (eligibleUsers.length === 0) {
    return { success: true, notified: 0 }
  }

  // Generate email content
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Parse the comment content to show a readable version (remove mention markup)
  const readableContent = commentContent.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1")

  // Create in-app notifications for ALL mentioned users (regardless of email preferences)
  const inAppPromises = mentionedUsers.map(async (user) => {
    await supabase
      .from("user_notifications")
      .insert({
        user_id: user.user_id,
        title: `${mentionerName} mentioned you`,
        message: readableContent.length > 100 ? readableContent.slice(0, 100) + "..." : readableContent,
        notification_type: "mention",
        story_id: storyId,
        comment_id: commentId,
      } as never)
  })

  await Promise.all(inAppPromises)

  // Send emails to eligible users (those with email notifications enabled)
  const emailPromises = eligibleUsers.map(async (user) => {
    if (!user.email) return { success: false, userId: user.user_id }

    const emailContent = generateMentionEmail({
      storyId,
      storyTitle,
      mentionerName,
      mentionedUserName: user.name,
      commentContent: readableContent,
      dashboardUrl,
    })

    const result = await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })

    return { ...result, userId: user.user_id }
  })

  const results = await Promise.all(emailPromises)
  const successCount = results.filter(r => r.success).length

  console.log(`Mention notifications sent: ${successCount}/${eligibleUsers.length} emails, ${mentionedUsers.length} in-app`)

  return {
    success: true,
    notified: successCount,
    total: eligibleUsers.length,
  }
}
