import { createClient } from "@/lib/supabase/server"
import { sendEmail, generateStatusChangeEmail } from "./email"
import { STATUS_NOTIFICATION_RULES, DEFAULT_NOTIFICATION_PREFERENCES } from "./config"
import type { StoryStatus, UserRole, NotificationPreferences } from "@/types/database"

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
    .single()

  // Get users to notify based on role and program assignment
  // For Program Managers, also filter by assigned_programs
  const { data: usersToNotify, error } = await supabase
    .from("users")
    .select("user_id, name, email, role, assigned_programs, notification_preferences")
    .in("role", rules.notifyRoles)
    .eq("status", "Active")
    .not("email", "is", null)
    .neq("user_id", changedByUserId) // Don't notify the person who made the change

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
