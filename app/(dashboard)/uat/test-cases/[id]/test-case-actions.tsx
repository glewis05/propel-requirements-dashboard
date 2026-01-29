"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateTestCase, reviewTestCase, archiveTestCase } from "@/app/(dashboard)/uat/actions"
import type { TestCaseStatus } from "@/types/database"
import { CheckCircle, Archive, Edit, PlayCircle } from "lucide-react"

interface TestCaseActionsProps {
  testCaseId: string
  currentStatus: TestCaseStatus
  isAiGenerated: boolean
  humanReviewed: boolean
}

export function TestCaseActions({
  testCaseId,
  currentStatus,
  isAiGenerated,
  humanReviewed,
}: TestCaseActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReview = async () => {
    setIsLoading(true)
    setError(null)
    const result = await reviewTestCase(testCaseId)
    if (!result.success) {
      setError(result.error || "Failed to review test case")
    }
    setIsLoading(false)
    router.refresh()
  }

  const handleMarkReady = async () => {
    setIsLoading(true)
    setError(null)
    const result = await updateTestCase(testCaseId, { status: "ready" })
    if (!result.success) {
      setError(result.error || "Failed to update status")
    }
    setIsLoading(false)
    router.refresh()
  }

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this test case?")) return
    setIsLoading(true)
    setError(null)
    const result = await archiveTestCase(testCaseId)
    if (!result.success) {
      setError(result.error || "Failed to archive test case")
    } else {
      router.push("/uat/test-cases")
    }
    setIsLoading(false)
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="font-medium">Actions</h3>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <div className="space-y-2">
        {isAiGenerated && !humanReviewed && (
          <button
            onClick={handleReview}
            disabled={isLoading}
            className="flex w-full items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            Approve & Mark Reviewed
          </button>
        )}

        {currentStatus === "draft" && (
          <button
            onClick={handleMarkReady}
            disabled={isLoading}
            className="flex w-full items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            Mark as Ready
          </button>
        )}

        {currentStatus !== "deprecated" && (
          <button
            onClick={handleArchive}
            disabled={isLoading}
            className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>
        )}
      </div>
    </div>
  )
}
