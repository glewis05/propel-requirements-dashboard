"use client"

import { useState } from "react"
import type { DefectFormData } from "@/app/(dashboard)/uat/defect-actions"
import type { DefectSeverity } from "@/types/database"
import { Save, X, Bug } from "lucide-react"

interface DefectFormProps {
  storyId: string
  programId: string
  executionId?: string
  testCaseId?: string
  failedStepNumber?: number
  initialData?: Partial<DefectFormData>
  onSubmit: (data: DefectFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function DefectForm({
  storyId,
  programId,
  executionId,
  testCaseId,
  failedStepNumber,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: DefectFormProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [stepsToReproduce, setStepsToReproduce] = useState(initialData?.steps_to_reproduce || "")
  const [expectedBehavior, setExpectedBehavior] = useState(initialData?.expected_behavior || "")
  const [actualBehavior, setActualBehavior] = useState(initialData?.actual_behavior || "")
  const [severity, setSeverity] = useState<DefectSeverity>(initialData?.severity || "medium")
  const [environment, setEnvironment] = useState(initialData?.environment || "")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    await onSubmit({
      execution_id: executionId,
      test_case_id: testCaseId,
      story_id: storyId,
      program_id: programId,
      title: title.trim(),
      description: description.trim() || undefined,
      steps_to_reproduce: stepsToReproduce.trim() || undefined,
      expected_behavior: expectedBehavior.trim() || undefined,
      actual_behavior: actualBehavior.trim() || undefined,
      severity,
      environment: environment.trim() || undefined,
      failed_step_number: failedStepNumber,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the defect"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="critical">Critical - System down</option>
            <option value="high">High - Major functionality broken</option>
            <option value="medium">Medium - Feature impaired</option>
            <option value="low">Low - Minor issue</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Environment</label>
          <input
            type="text"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            placeholder="e.g., Staging, QA"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description of the defect"
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Steps to Reproduce</label>
        <textarea
          value={stepsToReproduce}
          onChange={(e) => setStepsToReproduce(e.target.value)}
          placeholder="1. Navigate to...\n2. Click on...\n3. Observe..."
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Expected Behavior</label>
          <textarea
            value={expectedBehavior}
            onChange={(e) => setExpectedBehavior(e.target.value)}
            placeholder="What should happen"
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Actual Behavior</label>
          <textarea
            value={actualBehavior}
            onChange={(e) => setActualBehavior(e.target.value)}
            placeholder="What actually happened"
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Bug className="h-4 w-4" />
          {isLoading ? "Submitting..." : "Report Defect"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
