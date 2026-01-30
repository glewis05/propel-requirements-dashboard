"use client"

import { useState } from "react"
import { TestStepEditor } from "./TestStepEditor"
import type { TestStep } from "@/types/database"
import type { TestCaseFormData } from "@/app/(dashboard)/validation/actions"
import { Save, X } from "lucide-react"

interface TestCaseFormProps {
  storyId: string
  programId: string
  initialData?: Partial<TestCaseFormData>
  onSubmit: (data: TestCaseFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function TestCaseForm({
  storyId,
  programId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: TestCaseFormProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [preconditions, setPreconditions] = useState(initialData?.preconditions || "")
  const [testData, setTestData] = useState(initialData?.test_data || "")
  const [testSteps, setTestSteps] = useState<TestStep[]>(initialData?.test_steps || [])
  const [expectedResults, setExpectedResults] = useState(initialData?.expected_results || "")
  const [testType, setTestType] = useState(initialData?.test_type || "functional")
  const [priority, setPriority] = useState(initialData?.priority || "medium")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    if (testSteps.length === 0) {
      setError("At least one test step is required")
      return
    }

    const hasEmptySteps = testSteps.some(s => !s.action.trim() || !s.expected_result.trim())
    if (hasEmptySteps) {
      setError("All test steps must have an action and expected result")
      return
    }

    await onSubmit({
      story_id: storyId,
      program_id: programId,
      title: title.trim(),
      description: description.trim() || undefined,
      preconditions: preconditions.trim() || undefined,
      test_data: testData.trim() || undefined,
      test_steps: testSteps,
      expected_results: expectedResults.trim() || undefined,
      test_type: testType,
      priority,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter test case title"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this test case validate?"
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Test Type</label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="functional">Functional</option>
            <option value="regression">Regression</option>
            <option value="integration">Integration</option>
            <option value="smoke">Smoke</option>
            <option value="boundary">Boundary</option>
            <option value="security">Security</option>
            <option value="accessibility">Accessibility</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Preconditions</label>
          <textarea
            value={preconditions}
            onChange={(e) => setPreconditions(e.target.value)}
            placeholder="Required setup or state before executing this test"
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Test Data</label>
          <textarea
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
            placeholder="Specific test data required"
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>

      <TestStepEditor steps={testSteps} onChange={setTestSteps} />

      <div>
        <label className="block text-sm font-medium mb-1">Overall Expected Results</label>
        <textarea
          value={expectedResults}
          onChange={(e) => setExpectedResults(e.target.value)}
          placeholder="Summary of expected outcomes"
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isLoading ? "Saving..." : "Save Test Case"}
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
