"use client"

import { useRouter } from "next/navigation"
import { StatusTransition } from "./status-transition"
import type { StoryStatus, UserRole } from "@/types/database"

interface StatusTransitionWrapperProps {
  storyId: string
  currentStatus: StoryStatus
  userRole: UserRole | null
}

export function StatusTransitionWrapper({
  storyId,
  currentStatus,
  userRole,
}: StatusTransitionWrapperProps) {
  const router = useRouter()

  const handleStatusChange = () => {
    // Refresh the page to show the updated status
    router.refresh()
  }

  return (
    <StatusTransition
      storyId={storyId}
      currentStatus={currentStatus}
      userRole={userRole}
      onStatusChange={handleStatusChange}
    />
  )
}
