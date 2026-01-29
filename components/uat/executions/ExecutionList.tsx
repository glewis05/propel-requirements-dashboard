"use client"

import { useState } from "react"
import { ExecutionCard } from "./ExecutionCard"
import type { ExecutionStatus } from "@/types/database"
import { Search, Filter } from "lucide-react"

interface Execution {
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

interface ExecutionListProps {
  executions: Execution[]
  testCaseNames?: Record<string, string>
  userNames?: Record<string, string>
  showFilters?: boolean
}

export function ExecutionList({ executions, testCaseNames, userNames, showFilters = true }: ExecutionListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [search, setSearch] = useState("")

  const filtered = executions.filter(ex => {
    if (statusFilter && ex.status !== statusFilter) return false
    if (search) {
      const tcName = testCaseNames?.[ex.test_case_id] || ""
      const userName = userNames?.[ex.assigned_to] || ""
      const searchLower = search.toLowerCase()
      if (!tcName.toLowerCase().includes(searchLower) && !userName.toLowerCase().includes(searchLower) && !ex.story_id.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    return true
  })

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search executions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
              <option value="verified">Verified</option>
            </select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No executions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ex => (
            <ExecutionCard
              key={ex.execution_id}
              execution={ex}
              testCaseTitle={testCaseNames?.[ex.test_case_id]}
              assignedToName={userNames?.[ex.assigned_to]}
            />
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {executions.length} executions
      </div>
    </div>
  )
}
