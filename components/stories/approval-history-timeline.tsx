"use client"

import { useState } from "react"
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  User,
  MessageSquare,
} from "lucide-react"
import type { StoryStatus, ApprovalType, ApprovalStatus } from "@/types/database"

interface ApprovalRecord {
  id: string
  story_id: string
  approved_by: string
  approval_type: ApprovalType
  status: ApprovalStatus
  previous_status: string | null
  notes: string | null
  approved_at: string
  approver_name?: string
}

interface VersionRecord {
  id: string
  story_id: string
  version_number: number
  change_summary: string | null
  changed_fields: string[] | null
  changed_by: string
  changed_at: string
  changer_name?: string
}

interface ApprovalHistoryTimelineProps {
  approvals: ApprovalRecord[]
  versions: VersionRecord[]
  storyCreatedAt: string
  creatorName?: string
}

type TimelineEvent = {
  id: string
  type: "approval" | "version" | "created"
  date: string
  data: ApprovalRecord | VersionRecord | { creatorName?: string }
}

export function ApprovalHistoryTimeline({
  approvals,
  versions,
  storyCreatedAt,
  creatorName,
}: ApprovalHistoryTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Combine and sort all events by date (newest first)
  const allEvents: TimelineEvent[] = [
    // Created event
    {
      id: "created",
      type: "created" as const,
      date: storyCreatedAt,
      data: { creatorName },
    },
    // Approvals
    ...approvals.map((a) => ({
      id: `approval-${a.id}`,
      type: "approval" as const,
      date: a.approved_at,
      data: a,
    })),
    // Version changes (filter out version 1 since we have created event)
    ...versions
      .filter((v) => v.version_number > 1)
      .map((v) => ({
        id: `version-${v.id}`,
        type: "version" as const,
        date: v.changed_at,
        data: v,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Show only first 3 events when collapsed
  const visibleEvents = isExpanded ? allEvents : allEvents.slice(0, 3)
  const hasMoreEvents = allEvents.length > 3

  const getApprovalIcon = (status: ApprovalStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-success" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "needs_discussion":
        return <AlertCircle className="h-4 w-4 text-warning" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getApprovalTypeLabel = (type: ApprovalType) => {
    switch (type) {
      case "internal_review":
        return "Internal Review"
      case "stakeholder":
        return "Stakeholder Approval"
      case "portfolio":
        return "Portfolio Approval"
      default:
        return type
    }
  }

  const getStatusLabel = (status: ApprovalStatus) => {
    switch (status) {
      case "approved":
        return "Approved"
      case "rejected":
        return "Rejected"
      case "needs_discussion":
        return "Needs Discussion"
      default:
        return status
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const renderEvent = (event: TimelineEvent, isLast: boolean) => {
    switch (event.type) {
      case "created":
        return (
          <TimelineItem
            key={event.id}
            icon={<FileText className="h-4 w-4 text-primary" />}
            iconBg="bg-primary/10"
            title="Story Created"
            subtitle={(event.data as { creatorName?: string }).creatorName || "Unknown"}
            date={formatDate(event.date)}
            isLast={isLast}
          />
        )

      case "approval": {
        const approval = event.data as ApprovalRecord
        return (
          <TimelineItem
            key={event.id}
            icon={getApprovalIcon(approval.status)}
            iconBg={
              approval.status === "approved"
                ? "bg-success/10"
                : approval.status === "rejected"
                ? "bg-destructive/10"
                : "bg-warning/10"
            }
            title={`${getApprovalTypeLabel(approval.approval_type)}: ${getStatusLabel(approval.status)}`}
            subtitle={approval.approver_name || "Unknown"}
            date={formatDate(event.date)}
            notes={approval.notes}
            previousStatus={approval.previous_status}
            isLast={isLast}
          />
        )
      }

      case "version": {
        const version = event.data as VersionRecord
        return (
          <TimelineItem
            key={event.id}
            icon={<ArrowRight className="h-4 w-4 text-muted-foreground" />}
            iconBg="bg-muted"
            title={version.change_summary || `Version ${version.version_number}`}
            subtitle={version.changer_name || "Unknown"}
            date={formatDate(event.date)}
            changedFields={version.changed_fields}
            isLast={isLast}
          />
        )
      }

      default:
        return null
    }
  }

  if (allEvents.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg bg-card shadow-sm border border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Approval History
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {approvals.length} approval{approvals.length !== 1 ? "s" : ""} · {versions.length} version{versions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="p-4">
        <div className="relative">
          {visibleEvents.map((event, index) =>
            renderEvent(event, index === visibleEvents.length - 1)
          )}
        </div>

        {hasMoreEvents && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {allEvents.length - 3} more events
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

interface TimelineItemProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  date: string
  notes?: string | null
  previousStatus?: string | null
  changedFields?: string[] | null
  isLast: boolean
}

function TimelineItem({
  icon,
  iconBg,
  title,
  subtitle,
  date,
  notes,
  previousStatus,
  changedFields,
  isLast,
}: TimelineItemProps) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
      )}

      {/* Icon */}
      <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{date}</span>
        </div>

        {previousStatus && (
          <p className="text-xs text-muted-foreground mt-1">
            From: <span className="font-medium">{previousStatus}</span>
          </p>
        )}

        {changedFields && changedFields.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {changedFields.map((field) => (
              <span
                key={field}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {field}
              </span>
            ))}
          </div>
        )}

        {notes && (
          <div className="mt-2 flex gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
            <MessageSquare className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <p className="italic">&ldquo;{notes}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  )
}
