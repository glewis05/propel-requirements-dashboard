"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { TestStep, StepResult } from "@/types/database"
import {
  startTestExecution,
  submitStepResult,
  completeTestExecution,
} from "@/app/tester/tester-execution-actions"
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  SkipForward,
  Clock,
  ArrowLeft,
  HelpCircle,
} from "lucide-react"

interface TesterExecutionRunnerProps {
  executionId: string
  cycleId: string
  testSteps: TestStep[]
  stepResults: StepResult[]
  status: string
  hasTestPatient: boolean
  onUpdate?: () => void
}

const stepStatusIcons = {
  passed: <CheckCircle className="h-5 w-5 text-green-600" />,
  failed: <XCircle className="h-5 w-5 text-red-600" />,
  blocked: <AlertTriangle className="h-5 w-5 text-orange-600" />,
  skipped: <SkipForward className="h-5 w-5 text-gray-400" />,
}

export function TesterExecutionRunner({
  executionId,
  cycleId,
  testSteps,
  stepResults,
  status,
  hasTestPatient,
  onUpdate,
}: TesterExecutionRunnerProps) {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [completionNotes, setCompletionNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const canEdit = status === "in_progress"
  const resultMap = new Map(stepResults.map((r) => [r.step_number, r]))

  const handleStart = async () => {
    if (!hasTestPatient) {
      setError("Please select a test patient before starting")
      return
    }

    setIsStarting(true)
    setError(null)
    const result = await startTestExecution(executionId)
    if (!result.success) {
      setError(result.error || "Failed to start test")
    }
    setIsStarting(false)
    onUpdate?.()
  }

  const handleStepResult = async (
    stepNumber: number,
    stepStatus: StepResult["status"],
    actualResult: string,
    notes?: string
  ) => {
    setError(null)
    const result = await submitStepResult(executionId, {
      step_number: stepNumber,
      status: stepStatus,
      actual_result: actualResult,
      notes,
      executed_at: new Date().toISOString(),
    })
    if (!result.success) {
      setError(result.error || "Failed to update step")
    }
    onUpdate?.()
  }

  const handleComplete = async (completionStatus: "passed" | "failed" | "blocked") => {
    setIsCompleting(true)
    setError(null)
    const result = await completeTestExecution(
      executionId,
      completionStatus,
      completionNotes || undefined
    )
    if (!result.success) {
      setError(result.error || "Failed to complete test")
    } else {
      // Redirect back to test queue
      router.push(`/tester/cycle/${cycleId}`)
    }
    setIsCompleting(false)
  }

  const handleBack = () => {
    router.push(`/tester/cycle/${cycleId}`)
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Help */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Test Queue
        </button>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </button>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="rounded-lg border bg-blue-50 border-blue-200 p-4">
          <h4 className="font-medium text-blue-900 mb-2">Status Definitions</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <strong>Pass:</strong> The step worked exactly as expected
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <strong>Fail:</strong> The step did not work as expected (report a defect)
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <strong>Blocked:</strong> Cannot complete due to an external issue
            </li>
            <li className="flex items-center gap-2">
              <SkipForward className="h-4 w-4 text-gray-500" />
              <strong>Skip:</strong> Step is not applicable to this test scenario
            </li>
          </ul>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Start Button */}
      {status === "assigned" && (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center bg-gray-50">
          <Clock className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">Ready to Start Testing</h3>
          <p className="text-sm text-gray-500 mb-4">
            {hasTestPatient
              ? "Click the button below to begin executing test steps."
              : "Select a test patient above, then click start."}
          </p>
          <button
            onClick={handleStart}
            disabled={isStarting || !hasTestPatient}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-5 w-5" />
            {isStarting ? "Starting..." : "Start Testing"}
          </button>
        </div>
      )}

      {/* Test Steps */}
      {(status === "in_progress" || status !== "assigned") && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Test Steps</h3>
          {testSteps.map((step) => {
            const result = resultMap.get(step.step_number)
            return (
              <TesterStepInput
                key={step.step_number}
                step={step}
                result={result}
                canEdit={canEdit}
                onSubmit={(stepStatus, actualResult, notes) =>
                  handleStepResult(step.step_number, stepStatus, actualResult, notes)
                }
              />
            )
          })}
        </div>
      )}

      {/* Completion Actions */}
      {canEdit && (
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <h3 className="font-medium text-gray-900">Complete Test</h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              Overall Notes (optional)
            </label>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Any additional observations about this test..."
              rows={2}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm resize-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleComplete("passed")}
              disabled={isCompleting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Pass Test
            </button>
            <button
              onClick={() => handleComplete("failed")}
              disabled={isCompleting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Fail Test
            </button>
            <button
              onClick={() => handleComplete("blocked")}
              disabled={isCompleting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              <AlertTriangle className="h-4 w-4" />
              Blocked
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Tester Step Input Sub-component (Simplified for testers)
// ============================================================================

interface TesterStepInputProps {
  step: TestStep
  result?: StepResult
  canEdit: boolean
  onSubmit: (status: StepResult["status"], actualResult: string, notes?: string) => void
}

function TesterStepInput({ step, result, canEdit, onSubmit }: TesterStepInputProps) {
  const [actualResult, setActualResult] = useState(result?.actual_result || "")
  const [notes, setNotes] = useState(result?.notes || "")
  const [isExpanded, setIsExpanded] = useState(!result)

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        result?.status === "passed" && "border-green-200 bg-green-50",
        result?.status === "failed" && "border-red-200 bg-red-50",
        result?.status === "blocked" && "border-orange-200 bg-orange-50",
        result?.status === "skipped" && "border-gray-200 bg-gray-50",
        !result && "border-gray-200 bg-white"
      )}
    >
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Step Number */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
          {step.step_number}
        </div>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{step.action}</p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Expected:</span> {step.expected_result}
          </p>
          {step.notes && (
            <p className="text-xs text-gray-500 mt-1 italic">{step.notes}</p>
          )}
        </div>

        {/* Status Icon */}
        <div className="shrink-0">
          {result ? (
            stepStatusIcons[result.status]
          ) : (
            <Clock className="h-5 w-5 text-gray-300" />
          )}
        </div>
      </div>

      {/* Editable Form */}
      {isExpanded && canEdit && (
        <div className="mt-4 ml-11 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              What happened? (Actual Result)
            </label>
            <textarea
              value={actualResult}
              onChange={(e) => setActualResult(e.target.value)}
              placeholder="Describe what actually happened when you performed this step..."
              rows={2}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm resize-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other observations..."
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status Buttons - Large touch targets for mobile */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              onClick={() => onSubmit("passed", actualResult, notes || undefined)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 active:bg-green-800"
            >
              <CheckCircle className="h-4 w-4" />
              Pass
            </button>
            <button
              onClick={() => onSubmit("failed", actualResult, notes || undefined)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800"
            >
              <XCircle className="h-4 w-4" />
              Fail
            </button>
            <button
              onClick={() => onSubmit("blocked", actualResult, notes || undefined)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 active:bg-orange-800"
            >
              <AlertTriangle className="h-4 w-4" />
              Blocked
            </button>
            <button
              onClick={() => onSubmit("skipped", actualResult, notes || undefined)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
            >
              <SkipForward className="h-4 w-4" />
              Skip
            </button>
          </div>
        </div>
      )}

      {/* View-only result */}
      {isExpanded && result && !canEdit && (
        <div className="mt-4 ml-11 space-y-2">
          {result.actual_result && (
            <p className="text-sm">
              <span className="font-medium text-gray-700">Actual:</span>{" "}
              <span className="text-gray-600">{result.actual_result}</span>
            </p>
          )}
          {result.notes && (
            <p className="text-sm text-gray-500">
              <span className="font-medium">Notes:</span> {result.notes}
            </p>
          )}
          {result.executed_at && (
            <p className="text-xs text-gray-400">
              Completed: {new Date(result.executed_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
