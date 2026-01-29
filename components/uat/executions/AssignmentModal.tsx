"use client"

import { useState } from "react"
import { assignExecution } from "@/app/(dashboard)/uat/execution-actions"
import { X, UserPlus } from "lucide-react"

interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  testCaseIds: string[]
  storyId: string
  testers: Array<{ user_id: string; name: string }>
  onAssigned?: () => void
}

export function AssignmentModal({
  isOpen,
  onClose,
  testCaseIds,
  storyId,
  testers,
  onAssigned,
}: AssignmentModalProps) {
  const [selectedTester, setSelectedTester] = useState("")
  const [environment, setEnvironment] = useState("")
  const [cycleName, setCycleName] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAssign = async () => {
    if (!selectedTester) {
      setError("Please select a tester")
      return
    }

    setIsAssigning(true)
    setError(null)

    const result = await assignExecution({
      test_case_ids: testCaseIds,
      story_id: storyId,
      assigned_to: selectedTester,
      environment: environment || undefined,
      cycle_name: cycleName || undefined,
    })

    if (result.success) {
      onAssigned?.()
      onClose()
    } else {
      setError(result.error || "Failed to assign tests")
    }

    setIsAssigning(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Assign Test{testCaseIds.length > 1 ? "s" : ""}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Assign {testCaseIds.length} test case{testCaseIds.length > 1 ? "s" : ""} to a tester
          </p>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Tester *</label>
            <select
              value={selectedTester}
              onChange={(e) => setSelectedTester(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a tester...</option>
              {testers.map(t => (
                <option key={t.user_id} value={t.user_id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Environment</label>
            <input
              type="text"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="e.g., Staging, QA, Production"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Test Cycle</label>
            <input
              type="text"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              placeholder="e.g., Sprint 12 UAT, Release 2.0"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t p-4">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={isAssigning || !selectedTester}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {isAssigning ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  )
}
