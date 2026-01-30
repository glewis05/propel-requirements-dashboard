"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { DEFECT_STATUS_CONFIG } from "@/lib/validation/execution-transitions"
import type { DefectSeverity, DefectStatus } from "@/types/database"
import { Bug, AlertTriangle, Clock } from "lucide-react"

interface DefectCardProps {
  defect: {
    defect_id: string
    title: string
    description: string | null
    severity: DefectSeverity
    status: DefectStatus
    story_id: string
    reported_by: string
    created_at: string
  }
  reportedByName?: string
}

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
}

const severityIcons: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="h-3 w-3" />,
  high: <AlertTriangle className="h-3 w-3" />,
}

export function DefectCard({ defect, reportedByName }: DefectCardProps) {
  const statusConfig = DEFECT_STATUS_CONFIG[defect.status]

  return (
    <Link
      href={`/validation/defects/${defect.defect_id}`}
      className="block rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Bug className="h-4 w-4 text-red-500 shrink-0" />
            <h3 className="font-medium text-sm truncate">{defect.title}</h3>
          </div>
          {defect.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {defect.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border", statusConfig.color)}>
            {statusConfig.label}
          </span>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border", severityColors[defect.severity])}>
            {severityIcons[defect.severity]}
            {defect.severity}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span>Story: {defect.story_id}</span>
        {reportedByName && <span>By: {reportedByName}</span>}
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(defect.created_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  )
}
