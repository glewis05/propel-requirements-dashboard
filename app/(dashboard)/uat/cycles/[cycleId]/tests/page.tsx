"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw, FileText, CheckCircle } from "lucide-react"
import { getCycleById } from "../../cycle-actions"
import { getCycleTestCases, getAlreadyAssignedTestCases } from "../../assignment-actions"
import { cn } from "@/lib/utils"

interface PageParams {
  cycleId: string
}

export default function CycleTestsPage({ params }: { params: Promise<PageParams> }) {
  const [cycleId, setCycleId] = useState<string>("")
  const [cycle, setCycle] = useState<{ name: string; locked_at: string | null } | null>(null)
  const [testCases, setTestCases] = useState<{
    test_case_id: string
    story_id: string
    title: string
    description: string | null
    story_title: string
    test_type: string
    priority: string
    status: string
  }[]>([])
  const [alreadyAssigned, setAlreadyAssigned] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    params.then(p => {
      setCycleId(p.cycleId)
      loadData(p.cycleId)
    })
  }, [params])

  const loadData = async (id: string) => {
    setIsLoading(true)
    const [cycleResult, testCasesResult, assignedResult] = await Promise.all([
      getCycleById(id),
      getCycleTestCases(id),
      getAlreadyAssignedTestCases(id),
    ])

    if (cycleResult.success && cycleResult.cycle) {
      setCycle({
        name: cycleResult.cycle.name,
        locked_at: cycleResult.cycle.locked_at,
      })
    }

    if (testCasesResult.success) {
      setTestCases(testCasesResult.testCases || [])
    }

    if (assignedResult.success) {
      setAlreadyAssigned(new Set(assignedResult.assignedTestCaseIds || []))
    }

    setIsLoading(false)
  }

  const availableTests = testCases.filter(tc => !alreadyAssigned.has(tc.test_case_id))
  const assignedTests = testCases.filter(tc => alreadyAssigned.has(tc.test_case_id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/uat/cycles/${cycleId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycle
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Test Cases</h1>
            <p className="text-muted-foreground">{cycle?.name}</p>
          </div>
          {!cycle?.locked_at && availableTests.length > 0 && (
            <Link
              href={`/uat/cycles/${cycleId}/assign`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Assign Tests
            </Link>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{testCases.length}</p>
          <p className="text-sm text-muted-foreground">Total Available</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{assignedTests.length}</p>
          <p className="text-sm text-muted-foreground">Assigned</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{availableTests.length}</p>
          <p className="text-sm text-muted-foreground">Unassigned</p>
        </div>
      </div>

      {/* Assigned Tests */}
      {assignedTests.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Assigned to This Cycle ({assignedTests.length})
          </h2>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              {assignedTests.map((tc) => (
                <div key={tc.test_case_id} className="p-3 border-b last:border-b-0 bg-green-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{tc.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{tc.story_title}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded">
                      {tc.test_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Tests */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Available for Assignment ({availableTests.length})
        </h2>
        {availableTests.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-lg border">
            <CheckCircle className="mx-auto h-10 w-10 text-green-600" />
            <h3 className="mt-3 font-medium">All tests assigned</h3>
            <p className="text-sm text-muted-foreground">
              All available test cases have been assigned to this cycle.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              {availableTests.map((tc) => (
                <div key={tc.test_case_id} className="p-3 border-b last:border-b-0 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{tc.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{tc.story_title}</p>
                      {tc.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {tc.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded capitalize",
                        tc.priority === "critical" && "bg-red-100 text-red-700",
                        tc.priority === "high" && "bg-orange-100 text-orange-700",
                        tc.priority === "medium" && "bg-yellow-100 text-yellow-700",
                        tc.priority === "low" && "bg-gray-100 text-gray-700"
                      )}>
                        {tc.priority}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded capitalize">
                        {tc.test_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
