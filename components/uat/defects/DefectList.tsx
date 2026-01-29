"use client"

import { useState } from "react"
import { DefectCard } from "./DefectCard"
import type { DefectSeverity, DefectStatus } from "@/types/database"
import { Search, Filter } from "lucide-react"

interface Defect {
  defect_id: string
  title: string
  description: string | null
  severity: DefectSeverity
  status: DefectStatus
  story_id: string
  reported_by: string
  created_at: string
}

interface DefectListProps {
  defects: Defect[]
  userNames?: Record<string, string>
  showFilters?: boolean
}

export function DefectList({ defects, userNames, showFilters = true }: DefectListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [severityFilter, setSeverityFilter] = useState<string>("")

  const filtered = defects.filter(d => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && d.status !== statusFilter) return false
    if (severityFilter && d.severity !== severityFilter) return false
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
              placeholder="Search defects..."
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
              <option value="open">Open</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="fixed">Fixed</option>
              <option value="verified">Verified</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No defects found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => (
            <DefectCard
              key={d.defect_id}
              defect={d}
              reportedByName={userNames?.[d.reported_by]}
            />
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {defects.length} defects
      </div>
    </div>
  )
}
