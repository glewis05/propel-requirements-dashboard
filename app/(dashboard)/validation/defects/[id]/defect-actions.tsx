"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { transitionDefect, assignDefect } from "@/app/(dashboard)/validation/defect-actions"
import { getAllowedDefectTransitions } from "@/lib/validation/execution-transitions"
import type { DefectStatus, UserRole } from "@/types/database"
import { UserPlus } from "lucide-react"

interface DefectActionsProps {
  defectId: string
  currentStatus: DefectStatus
  userRole: UserRole
  testers: Array<{ user_id: string; name: string }>
  assignedTo: string | null
}

export function DefectActions({ defectId, currentStatus, userRole, testers, assignedTo }: DefectActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [selectedAssignee, setSelectedAssignee] = useState(assignedTo || "")

  const transitions = getAllowedDefectTransitions(currentStatus, userRole)
  const canAssign = ["Admin", "Portfolio Manager", "UAT Manager"].includes(userRole)

  const handleTransition = async (newStatus: DefectStatus) => {
    const transition = transitions.find(t => t.to === newStatus)
    if (transition?.requiresNotes && !notes.trim()) {
      setError("Notes are required for this action")
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await transitionDefect(defectId, newStatus, notes || undefined)

    if (!result.success) {
      setError(result.error || "Failed to update defect")
    } else {
      setNotes("")
    }

    setIsLoading(false)
    router.refresh()
  }

  const handleAssign = async () => {
    if (!selectedAssignee) {
      setError("Please select an assignee")
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await assignDefect(defectId, selectedAssignee)

    if (!result.success) {
      setError(result.error || "Failed to assign defect")
    }

    setIsLoading(false)
    router.refresh()
  }

  if (transitions.length === 0 && !canAssign) {
    return null
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="font-medium">Actions</h3>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {transitions.length > 0 && (
        <>
          {transitions.some(t => t.requiresNotes) && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                rows={2}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm resize-none"
              />
            </div>
          )}

          <div className="space-y-2">
            {transitions.map(transition => (
              <button
                key={transition.to}
                onClick={() => handleTransition(transition.to)}
                disabled={isLoading}
                className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {transition.label}
              </button>
            ))}
          </div>
        </>
      )}

      {canAssign && (
        <div className="pt-2 border-t space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">Assign To</label>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {testers.map(t => (
              <option key={t.user_id} value={t.user_id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={isLoading || !selectedAssignee}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {isLoading ? "Assigning..." : "Assign"}
          </button>
        </div>
      )}
    </div>
  )
}
