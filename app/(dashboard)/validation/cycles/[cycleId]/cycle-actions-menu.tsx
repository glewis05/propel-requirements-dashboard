"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Play, Pause, Lock, Trash2, Archive } from "lucide-react"
import { updateCycleStatus, lockCycle, deleteCycle } from "../cycle-actions"
import type { CycleStatus } from "@/types/database"

interface CycleActionsMenuProps {
  cycleId: string
  status: string
  isLocked: boolean
}

export function CycleActionsMenu({ cycleId, status, isLocked }: CycleActionsMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleStatusChange = async (newStatus: CycleStatus) => {
    setIsProcessing(true)
    const result = await updateCycleStatus(cycleId, newStatus)
    if (!result.success) {
      alert(result.error || "Failed to update status")
    }
    setIsProcessing(false)
    setIsOpen(false)
    router.refresh()
  }

  const handleLock = async () => {
    if (!confirm("Are you sure you want to lock this cycle? This action cannot be undone.")) {
      return
    }
    setIsProcessing(true)
    const result = await lockCycle(cycleId)
    if (!result.success) {
      alert(result.error || "Failed to lock cycle")
    }
    setIsProcessing(false)
    setIsOpen(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this cycle? This action cannot be undone.")) {
      return
    }
    setIsProcessing(true)
    const result = await deleteCycle(cycleId)
    if (!result.success) {
      alert(result.error || "Failed to delete cycle")
    } else {
      router.push("/validation/cycles")
    }
    setIsProcessing(false)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isProcessing}
        className="rounded-md border p-2 hover:bg-muted disabled:opacity-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-md border bg-card shadow-lg z-20">
            <div className="p-1">
              {/* Status Actions */}
              {status === "draft" && !isLocked && (
                <button
                  onClick={() => handleStatusChange("active")}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                >
                  <Play className="h-4 w-4 text-green-600" />
                  Activate Cycle
                </button>
              )}

              {status === "active" && !isLocked && (
                <>
                  <button
                    onClick={() => handleStatusChange("completed")}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Pause className="h-4 w-4 text-blue-600" />
                    Mark Complete
                  </button>
                  <button
                    onClick={() => handleStatusChange("draft")}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Pause className="h-4 w-4" />
                    Return to Draft
                  </button>
                </>
              )}

              {status === "completed" && !isLocked && (
                <>
                  <button
                    onClick={() => handleStatusChange("active")}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Play className="h-4 w-4 text-green-600" />
                    Reactivate
                  </button>
                  <button
                    onClick={() => handleStatusChange("archived")}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                </>
              )}

              {/* Lock Action */}
              {!isLocked && (
                <>
                  <div className="my-1 border-t" />
                  <button
                    onClick={handleLock}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted text-amber-600"
                  >
                    <Lock className="h-4 w-4" />
                    Lock Cycle
                  </button>
                </>
              )}

              {/* Delete Action */}
              {!isLocked && status === "draft" && (
                <>
                  <div className="my-1 border-t" />
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Cycle
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
