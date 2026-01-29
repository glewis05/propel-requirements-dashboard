"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { TestStep, StepResult, ExecutionStatus } from "@/types/database"
import { EXECUTION_STATUS_CONFIG, getAllowedExecutionTransitions } from "@/lib/uat/execution-transitions"
import type { UserRole } from "@/types/database"
import {
  startExecution,
  updateStepResult,
  completeExecution,
  verifyExecution,
} from "@/app/(dashboard)/uat/execution-actions"
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  SkipForward,
  Clock,
  Shield,
} from "lucide-react"

interface ExecutionRunnerProps {
  executionId: string
  testSteps: TestStep[]
  stepResults: StepResult[]
  status: ExecutionStatus
  userRole: UserRole | null
  isAssignedToMe: boolean
  onUpdate?: () => void
}

const stepStatusIcons = {
  passed: <CheckCircle className="h-5 w-5 text-green-600" />,
  failed: <XCircle className="h-5 w-5 text-red-600" />,
  blocked: <AlertTriangle className="h-5 w-5 text-orange-600" />,
  skipped: <SkipForward className="h-5 w-5 text-gray-400" />,
}

export function ExecutionRunner({
  executionId,
  testSteps,
  stepResults,
  status,
  userRole,
  isAssignedToMe,
  onUpdate,
}: ExecutionRunnerProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [completionNotes, setCompletionNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const statusConfig = EXECUTION_STATUS_CONFIG[status]
  const transitions = getAllowedExecutionTransitions(status, userRole)
  const canEdit = (status === "in_progress") && (isAssignedToMe || userRole === "Admin" || userRole === "UAT Manager")

  const resultMap = new Map(stepResults.map(r => [r.step_number, r]))

  const handleStart = async () => {
    setIsStarting(true)
    setError(null)
    const result = await startExecution(executionId)
    if (!result.success) {
      setError(result.error || "Failed to start execution")
    }
    setIsStarting(false)
    onUpdate?.()
  }

  const handleStepResult = async (stepNumber: number, stepStatus: StepResult["status"], actualResult: string, notes?: string) => {
    setError(null)
    const result = await updateStepResult(executionId, {
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
    const result = await completeExecution(executionId, completionStatus, completionNotes || undefined)
    if (!result.success) {
      setError(result.error || "Failed to complete execution")
    }
    setIsCompleting(false)
    onUpdate?.()
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    setError(null)
    const result = await verifyExecution(executionId)
    if (!result.success) {
      setError(result.error || "Failed to verify execution")
    }
    setIsVerifying(false)
    onUpdate?.()
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border", statusConfig.color)}>
            {statusConfig.label}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {status === "assigned" && (isAssignedToMe || userRole === "Admin" || userRole === "UAT Manager") && (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {isStarting ? "Starting..." : "Start Testing"}
            </button>
          )}

          {status === "passed" && transitions.some(t => t.to === "verified") && (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Shield className="h-4 w-4" />
              {isVerifying ? "Verifying..." : "Verify Result"}
            </button>
          )}

          {status === "failed" && transitions.some(t => t.to === "in_progress") && (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {isStarting ? "Starting..." : "Re-test"}
            </button>
          )}

          {status === "blocked" && transitions.some(t => t.to === "in_progress") && (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {isStarting ? "Starting..." : "Resume Testing"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Test Steps */}
      <div className="space-y-3">
        <h3 className="font-medium">Test Steps</h3>
        {testSteps.map((step) => {
          const result = resultMap.get(step.step_number)
          return (
            <StepResultInput
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

      {/* Completion Actions */}
      {status === "in_progress" && canEdit && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="font-medium">Complete Execution</h3>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Notes (optional)</label>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Any overall notes about this test execution..."
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleComplete("passed")}
              disabled={isCompleting}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Pass
            </button>
            <button
              onClick={() => handleComplete("failed")}
              disabled={isCompleting}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Fail
            </button>
            <button
              onClick={() => handleComplete("blocked")}
              disabled={isCompleting}
              className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
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
// Step Result Input Sub-component
// ============================================================================

interface StepResultInputProps {
  step: TestStep
  result?: StepResult
  canEdit: boolean
  onSubmit: (status: StepResult["status"], actualResult: string, notes?: string) => void
}

function StepResultInput({ step, result, canEdit, onSubmit }: StepResultInputProps) {
  const [actualResult, setActualResult] = useState(result?.actual_result || "")
  const [notes, setNotes] = useState(result?.notes || "")
  const [isExpanded, setIsExpanded] = useState(!result)

  return (
    <div className={cn(
      "rounded-lg border p-3",
      result?.status === "passed" && "border-green-200 bg-green-50",
      result?.status === "failed" && "border-red-200 bg-red-50",
      result?.status === "blocked" && "border-orange-200 bg-orange-50",
      result?.status === "skipped" && "border-gray-200 bg-gray-50",
      !result && "border-border"
    )}>
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
          {step.step_number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{step.action}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Expected: {step.expected_result}
          </p>
        </div>
        <div className="shrink-0">
          {result ? (
            stepStatusIcons[result.status]
          ) : (
            <Clock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && canEdit && (
        <div className="mt-3 ml-10 space-y-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Actual Result</label>
            <textarea
              value={actualResult}
              onChange={(e) => setActualResult(e.target.value)}
              placeholder="What actually happened?"
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSubmit("passed", actualResult, notes || undefined)}
              className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            >
              <CheckCircle className="h-3 w-3" />
              Pass
            </button>
            <button
              onClick={() => onSubmit("failed", actualResult, notes || undefined)}
              className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              <XCircle className="h-3 w-3" />
              Fail
            </button>
            <button
              onClick={() => onSubmit("blocked", actualResult, notes || undefined)}
              className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700"
            >
              <AlertTriangle className="h-3 w-3" />
              Blocked
            </button>
            <button
              onClick={() => onSubmit("skipped", actualResult, notes || undefined)}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <SkipForward className="h-3 w-3" />
              Skip
            </button>
          </div>
        </div>
      )}

      {isExpanded && result && !canEdit && (
        <div className="mt-3 ml-10 space-y-1">
          {result.actual_result && (
            <p className="text-xs">
              <span className="font-medium">Actual:</span> {result.actual_result}
            </p>
          )}
          {result.notes && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Notes:</span> {result.notes}
            </p>
          )}
          {result.executed_at && (
            <p className="text-xs text-muted-foreground">
              Executed: {new Date(result.executed_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
