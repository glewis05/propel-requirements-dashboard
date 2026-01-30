"use client"

import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Pencil,
  CheckCircle,
  Trash2,
  User,
  Clock,
  Globe,
} from "lucide-react"
import { HISTORY_ACTION_CONFIG, COMPLIANCE_STATUS_CONFIG } from "@/lib/compliance/constants"
import type { ComplianceMappingHistory } from "@/types/compliance"

interface ComplianceHistoryTimelineProps {
  history: ComplianceMappingHistory[]
  maxHeight?: string
  className?: string
}

const actionIcons = {
  created: Plus,
  updated: Pencil,
  verified: CheckCircle,
  deleted: Trash2,
}

export function ComplianceHistoryTimeline({
  history,
  maxHeight = "400px",
  className,
}: ComplianceHistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No history records found
      </div>
    )
  }

  return (
    <ScrollArea className={cn("pr-4", className)} style={{ maxHeight }}>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {history.map((entry, index) => {
            const actionConfig = HISTORY_ACTION_CONFIG[entry.action]
            const Icon = actionIcons[entry.action as keyof typeof actionIcons] || Pencil
            const prevStatusConfig = entry.previous_status
              ? COMPLIANCE_STATUS_CONFIG[entry.previous_status]
              : null
            const newStatusConfig = entry.new_status
              ? COMPLIANCE_STATUS_CONFIG[entry.new_status]
              : null

            return (
              <div key={entry.history_id} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center",
                    "border-2 border-background",
                    actionConfig?.color === "text-green-600" && "bg-green-100",
                    actionConfig?.color === "text-blue-600" && "bg-blue-100",
                    actionConfig?.color === "text-purple-600" && "bg-purple-100",
                    actionConfig?.color === "text-red-600" && "bg-red-100"
                  )}
                >
                  <Icon className={cn("h-3 w-3", actionConfig?.color)} />
                </div>

                {/* Content */}
                <div className="rounded-lg border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={cn("font-medium", actionConfig?.color)}>
                        {actionConfig?.label || entry.action}
                      </span>
                      {entry.action === "updated" && prevStatusConfig && newStatusConfig && (
                        <span className="text-sm text-muted-foreground ml-2">
                          {prevStatusConfig.label} → {newStatusConfig.label}
                        </span>
                      )}
                      {entry.action === "verified" && (
                        <Badge variant="outline" className="ml-2 text-xs text-green-600 border-green-300">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{entry.changed_by_name || "Unknown"}</span>
                    {entry.changed_by_email && (
                      <span className="text-xs">({entry.changed_by_email})</span>
                    )}
                  </div>

                  {/* Change reason */}
                  {entry.change_reason && (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      "{entry.change_reason}"
                    </p>
                  )}

                  {/* Audit details (expandable in future) */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                    {entry.ip_address && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {entry.ip_address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}

interface ComplianceHistoryCompactProps {
  history: ComplianceMappingHistory[]
  limit?: number
}

export function ComplianceHistoryCompact({
  history,
  limit = 5,
}: ComplianceHistoryCompactProps) {
  const displayHistory = history.slice(0, limit)

  if (displayHistory.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No history available</p>
    )
  }

  return (
    <div className="space-y-2">
      {displayHistory.map((entry) => {
        const actionConfig = HISTORY_ACTION_CONFIG[entry.action]

        return (
          <div
            key={entry.history_id}
            className="flex items-center gap-2 text-sm"
          >
            <span className={cn("font-medium", actionConfig?.color)}>
              {actionConfig?.label}
            </span>
            <span className="text-muted-foreground">by</span>
            <span>{entry.changed_by_name || "Unknown"}</span>
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
            </span>
          </div>
        )
      })}
      {history.length > limit && (
        <p className="text-xs text-muted-foreground">
          +{history.length - limit} more entries
        </p>
      )}
    </div>
  )
}
