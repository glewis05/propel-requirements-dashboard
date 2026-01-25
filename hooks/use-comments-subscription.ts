"use client"

import { useState, useCallback } from "react"
import { useRealtimeSubscription } from "./use-realtime-subscription"

export interface Comment {
  id: string
  story_id: string
  user_id: string | null
  content: string
  is_internal: boolean
  created_at: string
  updated_at: string
}

export function useCommentsSubscription(
  storyId: string,
  initialComments: Comment[]
) {
  const [comments, setComments] = useState<Comment[]>(initialComments)

  const handleInsert = useCallback((newComment: Comment) => {
    setComments((prev) => {
      // Check if comment already exists
      if (prev.some((c) => c.id === newComment.id)) {
        return prev
      }
      // Add to end (oldest first, newest last)
      return [...prev, newComment]
    })
  }, [])

  const handleUpdate = useCallback((updatedComment: Comment) => {
    setComments((prev) => {
      return prev.map((comment) =>
        comment.id === updatedComment.id ? updatedComment : comment
      )
    })
  }, [])

  const handleDelete = useCallback(({ old }: { old: Comment }) => {
    setComments((prev) => {
      return prev.filter((comment) => comment.id !== old.id)
    })
  }, [])

  const { isConnected, error } = useRealtimeSubscription<Comment>({
    table: "story_comments",
    filter: `story_id=eq.${storyId}`,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  })

  return { comments, isConnected, error }
}
