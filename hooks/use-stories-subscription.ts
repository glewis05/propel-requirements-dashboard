"use client"

import { useState, useCallback } from "react"
import { useRealtimeSubscription } from "./use-realtime-subscription"

export interface StoryListItem {
  story_id: string
  title: string
  user_story: string | null
  status: string
  priority: string | null
  category: string | null
  program_id: string
  roadmap_target: string | null
  updated_at: string
  deleted_at?: string | null
}

export function useStoriesSubscription(initialStories: StoryListItem[]) {
  const [stories, setStories] = useState<StoryListItem[]>(initialStories)

  const handleInsert = useCallback((newStory: StoryListItem) => {
    setStories((prev) => {
      // Don't insert soft-deleted stories
      if (newStory.deleted_at) {
        return prev
      }
      // Check if story already exists (avoid duplicates)
      if (prev.some((s) => s.story_id === newStory.story_id)) {
        return prev
      }
      // Insert at beginning (newest first)
      return [newStory, ...prev]
    })
  }, [])

  const handleUpdate = useCallback((updatedStory: StoryListItem) => {
    setStories((prev) => {
      // If story was soft-deleted, remove it from the list
      if (updatedStory.deleted_at) {
        return prev.filter((story) => story.story_id !== updatedStory.story_id)
      }
      return prev.map((story) =>
        story.story_id === updatedStory.story_id ? updatedStory : story
      )
    })
  }, [])

  const handleDelete = useCallback(({ old }: { old: StoryListItem }) => {
    setStories((prev) => {
      return prev.filter((story) => story.story_id !== old.story_id)
    })
  }, [])

  const { isConnected, error } = useRealtimeSubscription<StoryListItem>({
    table: "user_stories",
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  })

  return { stories, isConnected, error }
}
