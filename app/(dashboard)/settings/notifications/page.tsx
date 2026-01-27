import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/config"
import type { NotificationPreferences } from "@/types/database"

export default async function NotificationSettingsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Get user's notification preferences
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, notification_preferences")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    redirect("/login")
  }

  const preferences = (userData.notification_preferences as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notification Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage how you receive notifications about story updates
        </p>
      </div>

      {/* Settings Form */}
      <NotificationSettingsForm
        userId={userData.user_id}
        initialPreferences={preferences}
      />
    </div>
  )
}
