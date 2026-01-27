"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Lock, Loader2 } from "lucide-react"
import { StoryForm } from "@/components/stories/story-form"
import { updateStory, acquireStoryLock, releaseStoryLock } from "../../actions"
import type { StoryFormData } from "@/lib/validations/story"
import type { Database } from "@/types/database"

type Program = Database["public"]["Tables"]["programs"]["Row"]
type UserStory = Database["public"]["Tables"]["user_stories"]["Row"]

interface StoryOption {
  story_id: string
  title: string
  program_id: string
  program_name?: string
  parent_story_id?: string | null
}

interface StoryFormWrapperProps {
  storyId: string
  initialData: UserStory
  programs: Program[]
  potentialParents?: StoryOption[]
  allStories?: StoryOption[]
}

export function StoryFormWrapper({
  storyId,
  initialData,
  programs,
  potentialParents = [],
  allStories = [],
}: StoryFormWrapperProps) {
  const router = useRouter()
  const [lockState, setLockState] = useState<"acquiring" | "acquired" | "failed">("acquiring")
  const [lockError, setLockError] = useState<string | null>(null)

  // Acquire lock on mount
  useEffect(() => {
    let mounted = true

    async function acquireLock() {
      const result = await acquireStoryLock(storyId)
      if (!mounted) return

      if (result.success && result.locked) {
        setLockState("acquired")
      } else {
        setLockState("failed")
        setLockError(result.error || "Could not acquire edit lock. Another user may be editing.")
      }
    }

    acquireLock()

    // Release lock on unmount
    return () => {
      mounted = false
      releaseStoryLock(storyId)
    }
  }, [storyId])

  // Handle beforeunload to release lock
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable lock release on page unload
      navigator.sendBeacon?.(
        `/api/release-lock?storyId=${encodeURIComponent(storyId)}`
      )
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [storyId])

  const handleSubmit = useCallback(async (data: StoryFormData) => {
    const result = await updateStory(storyId, data)
    if (result.success) {
      // Release lock before navigating
      await releaseStoryLock(storyId)
    }
    return result
  }, [storyId])

  const handleCancel = useCallback(async () => {
    // Release lock before navigating
    await releaseStoryLock(storyId)
    router.push(`/stories/${storyId}`)
  }, [storyId, router])

  // Show acquiring state
  if (lockState === "acquiring") {
    return (
      <div className="rounded-lg bg-card shadow-sm border border-border p-8 flex flex-col items-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Acquiring edit lock...</p>
      </div>
    )
  }

  // Show lock failed state
  if (lockState === "failed") {
    return (
      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-6 flex flex-col items-center text-center">
        <Lock className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Unable to Edit</h2>
        <p className="text-muted-foreground mb-4">{lockError}</p>
        <button
          onClick={() => router.push(`/stories/${storyId}`)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View Story (Read Only)
        </button>
      </div>
    )
  }

  // Show form with lock acquired indicator
  return (
    <div className="space-y-4">
      {/* Lock Status Banner */}
      <div className="rounded-lg bg-success/10 border border-success/20 px-4 py-2 flex items-center gap-2">
        <Lock className="h-4 w-4 text-success" />
        <span className="text-sm text-success">Edit lock acquired - you have exclusive editing rights</span>
      </div>

      <StoryForm
        mode="edit"
        initialData={initialData}
        programs={programs}
        potentialParents={potentialParents}
        allStories={allStories}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
