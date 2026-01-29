"use client"

import { useState } from "react"
import { TestCaseCard } from "./TestCaseCard"
import type { TestCaseStatus, TestStep } from "@/types/database"
import { Search, Filter } from "lucide-react"

interface TestCase {
  test_case_id: string
  title: string
  description: string | null
  test_steps: TestStep[]
  test_type: string
  priority: string
  status: TestCaseStatus
  is_ai_generated: boolean
  human_reviewed: boolean
  created_at: string
  story_id: string
}

interface TestCaseListProps {
  testCases: TestCase[]
  showFilters?: boolean
}

export function TestCaseList({ testCases, showFilters = true }: TestCaseListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [priorityFilter, setPriorityFilter] = useState<string>("")

  const filtered = testCases.filter(tc => {
    if (search && !tc.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && tc.status !== statusFilter) return false
    if (typeFilter && tc.test_type !== typeFilter) return false
    if (priorityFilter && tc.priority !== priorityFilter) return false
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
              placeholder="Search test cases..."
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
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="deprecated">Deprecated</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="functional">Functional</option>
              <option value="regression">Regression</option>
              <option value="integration">Integration</option>
              <option value="smoke">Smoke</option>
              <option value="boundary">Boundary</option>
              <option value="security">Security</option>
              <option value="accessibility">Accessibility</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All Priority</option>
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
          <p className="text-muted-foreground">No test cases found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tc => (
            <TestCaseCard key={tc.test_case_id} testCase={tc} />
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {testCases.length} test cases
      </div>
    </div>
  )
}
