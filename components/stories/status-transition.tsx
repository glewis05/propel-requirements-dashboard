"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ArrowRight, X, CheckCircle, AlertCircle } from "lucide-react"
import { transitionStoryStatus } from "@/app/(dashboard)/stories/actions"
import { getAllowedTransitions, getStatusConfig, type StatusTransition as StatusTransitionType } from "@/lib/status-transitions"
import type { StoryStatus, UserRole } from "@/types/database"

interface StatusTransitionProps {
  storyId: string
  currentStatus: StoryStatus
  userRole: UserRole | null
  onStatusChange?: (newStatus: StoryStatus) => void
}

export function StatusTransition({
  storyId,
  currentStatus,
  userRole,
  onStatusChange,
}: StatusTransitionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState<StatusTransitionType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const statusConfig = getStatusConfig(currentStatus)
  const allowedTransitions = getAllowedTransitions(currentStatus, userRole)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle escape key for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen && !isLoading) {
        closeModal()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isModalOpen, isLoading])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isModalOpen])

  const handleTransitionClick = (transition: StatusTransitionType) => {
    setSelectedTransition(transition)
    setIsOpen(false)
    setNotes("")
    setError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTransition(null)
    setNotes("")
    setError(null)
  }

  const handleConfirm = async () => {
    if (!selectedTransition) return

    // Validate notes if required
    if (selectedTransition.requiresNotes && !notes.trim()) {
      setError("Notes are required for this status change")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await transitionStoryStatus(storyId, selectedTransition.to, notes.trim() || undefined)

      if (result.success) {
        closeModal()
        onStatusChange?.(selectedTransition.to)
      } else {
        setError(result.error || "Failed to update status")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Status transition error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // If no transitions are allowed, just show the status badge
  if (allowedTransitions.length === 0) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusConfig.color}`}
      >
        {currentStatus}
      </span>
    )
  }

  return (
    <>
      {/* Status dropdown trigger */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all hover:ring-2 hover:ring-offset-1 hover:ring-primary/20 ${statusConfig.color}`}
        >
          {currentStatus}
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[220px] rounded-lg bg-card shadow-lg border border-border py-1 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground">Change status to:</p>
            </div>
            {allowedTransitions.map((transition) => {
              const targetConfig = getStatusConfig(transition.to)
              return (
                <button
                  key={transition.to}
                  onClick={() => handleTransitionClick(transition)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                >
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1">{transition.label}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${targetConfig.color}`}
                  >
                    {transition.to}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Transition confirmation modal */}
      {isModalOpen && selectedTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={isLoading ? undefined : closeModal}
          />

          {/* Modal */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md mx-4 rounded-lg bg-card shadow-lg border border-border animate-in fade-in-0 zoom-in-95 duration-200"
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              disabled={isLoading}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-primary">
                  {selectedTransition.requiresApproval ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <ArrowRight className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedTransition.label}
                  </h2>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${statusConfig.color}`}>
                      {currentStatus}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getStatusConfig(selectedTransition.to).color}`}>
                      {selectedTransition.to}
                    </span>
                  </div>
                </div>
              </div>

              {/* Approval badge */}
              {selectedTransition.requiresApproval && (
                <div className="mt-4 p-3 rounded-md bg-success/10 border border-success/20">
                  <p className="text-sm text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    This will record an approval in the audit trail
                  </p>
                </div>
              )}

              {/* Notes field */}
              <div className="mt-4">
                <label htmlFor="transition-notes" className="block text-sm font-medium text-foreground mb-1.5">
                  Notes {selectedTransition.requiresNotes && <span className="text-destructive">*</span>}
                </label>
                <textarea
                  id="transition-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    selectedTransition.requiresNotes
                      ? "Please provide a reason for this status change..."
                      : "Optional notes for this status change..."
                  }
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
                {selectedTransition.requiresNotes && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Notes are required for this transition
                  </p>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? "Updating..." : "Confirm Change"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
