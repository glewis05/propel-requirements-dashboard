"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  RefreshCw,
  AtSign,
  FileText,
  AlertCircle,
  X,
} from "lucide-react"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type UserNotification,
} from "@/app/(dashboard)/notifications/actions"
import type { NotificationType } from "@/types/database"

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  mention: AtSign,
  reply: MessageSquare,
  status_change: RefreshCw,
  approval_needed: FileText,
  approval_result: Check,
  question_answered: Check,
  assigned: FileText,
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    const result = await getNotifications(20)
    if (result.success) {
      setNotifications(result.notifications || [])
      setUnreadCount(result.unreadCount || 0)
    }
    setIsLoading(false)
  }, [])

  // Load notifications on mount
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId)
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead()
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }

  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.notification_type] || Bell

                  return (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-muted/50 transition-colors ${
                        !notification.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      {notification.story_id ? (
                        <Link
                          href={`/stories/${notification.story_id}`}
                          onClick={() => handleNotificationClick(notification)}
                          className="flex items-start gap-3"
                        >
                          <NotificationContent
                            notification={notification}
                            Icon={Icon}
                          />
                        </Link>
                      ) : (
                        <div
                          className="flex items-start gap-3 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <NotificationContent
                            notification={notification}
                            Icon={Icon}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-muted/50 text-center">
              <button
                onClick={() => {
                  setIsOpen(false)
                  loadNotifications()
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationContent({
  notification,
  Icon,
}: {
  notification: UserNotification
  Icon: typeof Bell
}) {
  return (
    <>
      <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
        !notification.is_read ? "bg-primary/10" : "bg-muted"
      }`}>
        <Icon className={`h-4 w-4 ${!notification.is_read ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.is_read ? "font-medium" : ""}`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </>
  )
}
