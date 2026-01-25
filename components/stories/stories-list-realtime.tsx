"use client"

import { useStoriesSubscription, StoryListItem } from "@/hooks/use-stories-subscription"
import { StoriesList } from "./stories-list"

interface Program {
  program_id: string
  name: string
}

interface StoriesListRealtimeProps {
  initialStories: StoryListItem[]
  programs: Program[]
}

export function StoriesListRealtime({
  initialStories,
  programs,
}: StoriesListRealtimeProps) {
  const { stories, isConnected, error } = useStoriesSubscription(initialStories)

  return (
    <div className="relative">
      {/* Connection error banner */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
          Real-time connection error. Showing cached data.
        </div>
      )}

      {/* Stories list with real-time data */}
      <StoriesList stories={stories} programs={programs} />

      {/* Live indicator */}
      {isConnected && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full shadow-sm text-xs text-muted-foreground">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          Live
        </div>
      )}
    </div>
  )
}
