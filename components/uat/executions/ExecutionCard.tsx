"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { EXECUTION_STATUS_CONFIG } from "@/lib/uat/execution-transitions"
import type { ExecutionStatus } from "@/types/database"
import { Play, Clock, User } from "lucide-react"

interface ExecutionCardProps {
  execution: {
    execution_id: string
    test_case_id: string
    story_id: string
    assigned_to: string
    status: ExecutionStatus
    started_at: string | null
    completed_at: string | null
    environment: string | null
    cycle_name: string | null
    assigned_at: string
  }
  testCaseTitle?: string
  assignedToName?: string
}

export function ExecutionCard({ execution, testCaseTitle, assignedToName }: ExecutionCardProps) {
  const statusConfig = EXECUTION_STATUS_CONFIG[execution.status]

  return (
    <Link
      href={`/uat/executions/${execution.execution_id}`}
      className="block rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Play className="h-4 w-4 text-muted-foreground shrink-0" />
            <h3 className="font-medium text-sm truncate">
              {testCaseTitle || `Test Case ${execution.test_case_id.slice(0, 8)}`}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Story: {execution.story_id}
          </p>
        </div>
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border", statusConfig.color)}>
          {statusConfig.label}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        {assignedToName && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {assignedToName}
          </span>
        )}
        {execution.cycle_name && (
          <span>Cycle: {execution.cycle_name}</span>
        )}
        {execution.environment && (
          <span>Env: {execution.environment}</span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(execution.assigned_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  )
}
