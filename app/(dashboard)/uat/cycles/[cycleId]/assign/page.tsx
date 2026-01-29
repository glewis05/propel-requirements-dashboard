"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Play, CheckCircle, Users, AlertTriangle } from "lucide-react"
import { getCycleById } from "../../cycle-actions"
import { getCycleTesters, type CycleTesterWithUser } from "../../tester-pool-actions"
import {
  getCycleTestCases,
  getAlreadyAssignedTestCases,
  previewAssignment,
  executeAssignment,
  type AssignmentConfig,
  type AssignmentPreviewResult,
} from "../../assignment-actions"
import { cn } from "@/lib/utils"

interface PageParams {
  cycleId: string
}

export default function AssignTestsPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter()
  const [cycleId, setCycleId] = useState<string>("")
  const [cycle, setCycle] = useState<{
    name: string
    distribution_method: "equal" | "weighted"
    cross_validation_enabled: boolean
    cross_validation_percentage: number | null
    validators_per_test: number | null
    locked_at: string | null
  } | null>(null)
  const [testers, setTesters] = useState<CycleTesterWithUser[]>([])
  const [testCases, setTestCases] = useState<{
    test_case_id: string
    story_id: string
    title: string
    story_title: string
    test_type: string
    priority: string
  }[]>([])
  const [alreadyAssigned, setAlreadyAssigned] = useState<Set<string>>(new Set())
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<AssignmentPreviewResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"select" | "preview" | "complete">("select")

  useEffect(() => {
    params.then(p => {
      setCycleId(p.cycleId)
      loadData(p.cycleId)
    })
  }, [params])

  const loadData = async (id: string) => {
    setIsLoading(true)
    const [cycleResult, testersResult, testCasesResult, assignedResult] = await Promise.all([
      getCycleById(id),
      getCycleTesters(id),
      getCycleTestCases(id),
      getAlreadyAssignedTestCases(id),
    ])

    if (cycleResult.success && cycleResult.cycle) {
      setCycle({
        name: cycleResult.cycle.name,
        distribution_method: cycleResult.cycle.distribution_method,
        cross_validation_enabled: cycleResult.cycle.cross_validation_enabled,
        cross_validation_percentage: cycleResult.cycle.cross_validation_percentage,
        validators_per_test: cycleResult.cycle.validators_per_test,
        locked_at: cycleResult.cycle.locked_at,
      })
    }

    if (testersResult.success) {
      setTesters((testersResult.testers || []).filter(t => t.is_active))
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

  const toggleTest = (testCaseId: string) => {
    const newSelected = new Set(selectedTests)
    if (newSelected.has(testCaseId)) {
      newSelected.delete(testCaseId)
    } else {
      newSelected.add(testCaseId)
    }
    setSelectedTests(newSelected)
  }

  const selectAll = () => {
    setSelectedTests(new Set(availableTests.map(tc => tc.test_case_id)))
  }

  const clearAll = () => {
    setSelectedTests(new Set())
  }

  const handlePreview = async () => {
    if (!cycle || selectedTests.size === 0) return

    setIsPreviewLoading(true)
    setError(null)

    const config: AssignmentConfig = {
      cycleId,
      testCaseIds: Array.from(selectedTests),
      distributionMethod: cycle.distribution_method,
      crossValidationEnabled: cycle.cross_validation_enabled,
      crossValidationPercentage: cycle.cross_validation_percentage || undefined,
      validatorsPerTest: cycle.validators_per_test || undefined,
    }

    const result = await previewAssignment(config)

    if (!result.success) {
      setError(result.error || "Failed to generate preview")
      setIsPreviewLoading(false)
      return
    }

    setPreview(result.preview || null)
    setStep("preview")
    setIsPreviewLoading(false)
  }

  const handleExecute = async () => {
    if (!cycle || selectedTests.size === 0) return

    setIsExecuting(true)
    setError(null)

    const config: AssignmentConfig = {
      cycleId,
      testCaseIds: Array.from(selectedTests),
      distributionMethod: cycle.distribution_method,
      crossValidationEnabled: cycle.cross_validation_enabled,
      crossValidationPercentage: cycle.cross_validation_percentage || undefined,
      validatorsPerTest: cycle.validators_per_test || undefined,
    }

    const result = await executeAssignment(config)

    if (!result.success) {
      setError(result.error || "Failed to execute assignment")
      setIsExecuting(false)
      return
    }

    setStep("complete")
    setIsExecuting(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (cycle?.locked_at) {
    return (
      <div className="space-y-6">
        <Link
          href={`/uat/cycles/${cycleId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycle
        </Link>
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800">
          This cycle is locked. No new assignments can be made.
        </div>
      </div>
    )
  }

  if (testers.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          href={`/uat/cycles/${cycleId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycle
        </Link>
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800">
          No testers assigned to this cycle.{" "}
          <Link href={`/uat/cycles/${cycleId}/testers`} className="underline">
            Add testers
          </Link>{" "}
          before running assignments.
        </div>
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
        <h1 className="text-2xl font-bold tracking-tight">Assign Tests</h1>
        <p className="text-muted-foreground">{cycle?.name}</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step: Select Tests */}
      {step === "select" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {availableTests.length} tests available, {selectedTests.size} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-primary hover:underline"
              >
                Select All
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={clearAll}
                className="text-sm text-primary hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          {availableTests.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">All tests assigned</h3>
              <p className="mt-2 text-muted-foreground">
                All available test cases have been assigned to this cycle.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                {availableTests.map((tc) => (
                  <label
                    key={tc.test_case_id}
                    className="flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTests.has(tc.test_case_id)}
                      onChange={() => toggleTest(tc.test_case_id)}
                      className="h-4 w-4 rounded border-muted-foreground/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tc.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{tc.story_title}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground capitalize">
                      {tc.test_type}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handlePreview}
              disabled={selectedTests.size === 0 || isPreviewLoading}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPreviewLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Preview Assignment
            </button>
          </div>
        </>
      )}

      {/* Step: Preview */}
      {step === "preview" && preview && (
        <>
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Assignment Preview</h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-md text-center">
                <p className="text-2xl font-bold">{preview.totalTests}</p>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-md text-center">
                <p className="text-2xl font-bold">{preview.primaryTests}</p>
                <p className="text-sm text-muted-foreground">Primary</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-md text-center">
                <p className="text-2xl font-bold text-purple-700">{preview.crossValidationTests}</p>
                <p className="text-sm text-purple-600">Cross-Validation</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Tester Distribution
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium">Tester</th>
                  <th className="text-center p-3 font-medium">Capacity</th>
                  <th className="text-center p-3 font-medium">Primary</th>
                  <th className="text-center p-3 font-medium">Cross-Val</th>
                  <th className="text-center p-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {preview.testerAssignments.map((ta) => (
                  <tr key={ta.userId} className="border-t">
                    <td className="p-3 font-medium">{ta.userName}</td>
                    <td className="text-center p-3">{ta.capacityWeight}%</td>
                    <td className="text-center p-3">{ta.primaryCount}</td>
                    <td className="text-center p-3 text-purple-600">{ta.crossValidationCount}</td>
                    <td className="text-center p-3 font-bold">{ta.totalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.crossValidationGroups.length > 0 && (
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Cross-Validation Groups</h2>
                <p className="text-sm text-muted-foreground">
                  {preview.crossValidationGroups.length} tests will be validated by multiple testers
                </p>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {preview.crossValidationGroups.map((group) => (
                  <div key={group.testCaseId} className="p-3 border-b last:border-b-0">
                    <p className="font-medium text-sm">{group.testCaseTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      Assigned to: {group.assignedTesters.length} testers
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep("select")}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Back to Selection
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isExecuting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Execute Assignment
            </button>
          </div>
        </>
      )}

      {/* Step: Complete */}
      {step === "complete" && (
        <div className="text-center py-12 bg-card rounded-lg border">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
          <h3 className="mt-4 text-lg font-medium">Assignment Complete!</h3>
          <p className="mt-2 text-muted-foreground mb-6">
            Tests have been assigned to testers. They can now begin testing.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href={`/uat/cycles/${cycleId}`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Back to Cycle
            </Link>
            <button
              onClick={() => {
                setStep("select")
                setPreview(null)
                setSelectedTests(new Set())
                loadData(cycleId)
              }}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Assign More Tests
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
