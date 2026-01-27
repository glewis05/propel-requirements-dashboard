"use client"

import { useState, useCallback } from "react"
import { useRealtimeSubscription } from "./use-realtime-subscription"

export interface Comment {
  id: string
  story_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  is_question: boolean
  resolved: boolean
  accepted_answer: boolean
  accepted_at: string | null
  accepted_by: string | null
  created_at: string
  updated_at: string
  user_name?: string
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
