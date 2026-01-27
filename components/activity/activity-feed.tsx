"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Activity,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  HelpCircle,
  Link as LinkIcon,
  Trash2,
  Edit,
  RefreshCw,
  User,
  AlertCircle,
} from "lucide-react"
import { getRecentActivities, type ActivityWithDetails } from "@/app/(dashboard)/activity/actions"
import type { ActivityType } from "@/types/database"

interface ActivityFeedProps {
  initialActivities?: ActivityWithDetails[]
  limit?: number
  showHeader?: boolean
  compact?: boolean
}

const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: typeof Activity
  color: string
  bgColor: string
  verb: string
}> = {
  story_created: {
    icon: FileText,
    color: "text-success",
    bgColor: "bg-success/10",
    verb: "created",
  },
  story_updated: {
    icon: Edit,
    color: "text-primary",
    bgColor: "bg-primary/10",
    verb: "updated",
  },
  story_deleted: {
    icon: Trash2,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    verb: "deleted",
  },
  status_changed: {
    icon: RefreshCw,
    color: "text-warning",
    bgColor: "bg-warning/10",
    verb: "changed status of",
  },
  comment_added: {
    icon: MessageSquare,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    verb: "commented on",
  },
  comment_resolved: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
    verb: "resolved a comment on",
  },
  question_asked: {
    icon: HelpCircle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    verb: "asked a question on",
  },
  question_answered: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
    verb: "answered a question on",
  },
  approval_granted: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
    verb: "approved",
  },
  approval_rejected: {
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    verb: "rejected",
  },
  story_linked: {
    icon: LinkIcon,
    color: "text-primary",
    bgColor: "bg-primary/10",
    verb: "linked",
  },
  story_unlinked: {
    icon: LinkIcon,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    verb: "unlinked",
  },
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function getActivityDescription(activity: ActivityWithDetails): React.ReactNode {
  const config = ACTIVITY_CONFIG[activity.activity_type]
  const metadata = activity.metadata as Record<string, string>

  // Build the description based on activity type
  switch (activity.activity_type) {
    case "status_changed":
      return (
        <>
          changed status of{" "}
          {activity.story_id && activity.story_title ? (
            <Link
              href={`/stories/${activity.story_id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {activity.story_title}
            </Link>
          ) : (
            <span className="text-muted-foreground">a story</span>
          )}
          {metadata.from && metadata.to && (
            <span className="text-muted-foreground">
              {" "}from <span className="font-medium">{metadata.from}</span> to{" "}
              <span className="font-medium">{metadata.to}</span>
            </span>
          )}
        </>
      )

    case "story_linked":
      return (
        <>
          linked{" "}
          {activity.story_id && activity.story_title ? (
            <Link
              href={`/stories/${activity.story_id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {activity.story_title}
            </Link>
          ) : (
            <span className="text-muted-foreground">a story</span>
          )}
          {metadata.linked_story_id && (
            <>
              {" "}to{" "}
              <Link
                href={`/stories/${metadata.linked_story_id}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {metadata.linked_story_id}
              </Link>
            </>
          )}
        </>
      )

    case "approval_granted":
    case "approval_rejected":
      return (
        <>
          {config.verb}{" "}
          {activity.story_id && activity.story_title ? (
            <Link
              href={`/stories/${activity.story_id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {activity.story_title}
            </Link>
          ) : (
            <span className="text-muted-foreground">a story</span>
          )}
          {metadata.approval_type && (
            <span className="text-muted-foreground">
              {" "}({metadata.approval_type.replace("_", " ")})
            </span>
          )}
        </>
      )

    default:
      return (
        <>
          {config.verb}{" "}
          {activity.story_id && activity.story_title ? (
            <Link
              href={`/stories/${activity.story_id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {activity.story_title}
            </Link>
          ) : activity.story_id ? (
            <Link
              href={`/stories/${activity.story_id}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {activity.story_id}
            </Link>
          ) : (
            <span className="text-muted-foreground">a story</span>
          )}
        </>
      )
  }
}

export function ActivityFeed({
  initialActivities,
  limit = 50,
  showHeader = true,
  compact = false,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityWithDetails[]>(initialActivities || [])
  const [isLoading, setIsLoading] = useState(!initialActivities)
  const [error, setError] = useState<string | null>(null)

  const loadActivities = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const result = await getRecentActivities(limit)

    if (result.success && result.activities) {
      setActivities(result.activities)
    } else {
      setError(result.error || "Failed to load activities")
    }

    setIsLoading(false)
  }, [limit])

  useEffect(() => {
    if (!initialActivities) {
      loadActivities()
    }
  }, [initialActivities, loadActivities])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
        <AlertCircle className="h-4 w-4" />
        {error}
        <button
          onClick={loadActivities}
          className="ml-auto text-xs underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </h2>
          <button
            onClick={loadActivities}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No recent activity to show.
        </p>
      ) : (
        <div className={compact ? "space-y-2" : "space-y-4"}>
          {activities.map((activity) => {
            const config = ACTIVITY_CONFIG[activity.activity_type]
            const Icon = config.icon

            return (
              <div
                key={activity.id}
                className={`flex items-start gap-3 ${compact ? "py-1" : "py-2"}`}
              >
                {/* Icon */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${config.bgColor} flex-shrink-0`}
                >
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${compact ? "line-clamp-1" : ""}`}>
                    <span className="font-medium text-foreground">
                      {activity.user_name}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {getActivityDescription(activity)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
