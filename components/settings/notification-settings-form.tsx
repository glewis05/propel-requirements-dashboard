"use client"

import { useState } from "react"
import { Bell, Mail, MessageSquare, CheckCircle, AtSign, AlertCircle } from "lucide-react"
import { updateNotificationPreferences } from "@/app/(dashboard)/settings/actions"
import { NOTIFICATION_TYPES } from "@/lib/notifications/config"
import type { NotificationPreferences } from "@/types/database"

interface NotificationSettingsFormProps {
  userId: string
  initialPreferences: NotificationPreferences
}

export function NotificationSettingsForm({
  userId,
  initialPreferences,
}: NotificationSettingsFormProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
    setMessage(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const result = await updateNotificationPreferences(userId, preferences)

      if (result.success) {
        setMessage({ type: "success", text: "Notification preferences saved successfully" })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save preferences" })
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(initialPreferences)

  const notificationIcons: Record<string, React.ReactNode> = {
    status_changes: <Bell className="h-5 w-5" />,
    comments: <MessageSquare className="h-5 w-5" />,
    approvals: <CheckCircle className="h-5 w-5" />,
    mentions: <AtSign className="h-5 w-5" />,
  }

  return (
    <div className="space-y-6">
      {/* Master toggle */}
      <div className="rounded-lg bg-card shadow-sm border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Email Notifications</h2>
              <p className="text-sm text-muted-foreground">
                {preferences.email_enabled
                  ? "You will receive email notifications"
                  : "All email notifications are disabled"}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.email_enabled}
            onClick={() => handleToggle("email_enabled")}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              preferences.email_enabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.email_enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Individual notification types */}
      <div className="rounded-lg bg-card shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <h3 className="font-medium text-foreground">Notification Types</h3>
          <p className="text-sm text-muted-foreground">Choose which notifications you want to receive</p>
        </div>

        <div className="divide-y divide-border">
          {Object.entries(NOTIFICATION_TYPES).map(([key, config]) => {
            const prefKey = key as keyof NotificationPreferences
            const isEnabled = preferences[prefKey] && preferences.email_enabled

            return (
              <div
                key={key}
                className={`p-4 flex items-center justify-between ${
                  !preferences.email_enabled ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {notificationIcons[key]}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{config.label}</p>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences[prefKey]}
                  disabled={!preferences.email_enabled}
                  onClick={() => handleToggle(prefKey)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed ${
                    preferences[prefKey] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences[prefKey] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-success/10 text-success border border-success/20"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="px-6 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
