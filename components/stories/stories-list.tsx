"use client"

import { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { Search, ChevronRight, Calendar, Layers, X } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"

interface Story {
  story_id: string
  title: string
  user_story: string | null
  status: string
  priority: string | null
  category: string | null
  program_id: string
  roadmap_target: string | null
  updated_at: string
}

interface Program {
  program_id: string
  name: string
}

interface StoriesListProps {
  stories: Story[]
  programs: Program[]
}

// Threshold for enabling virtual scrolling
const VIRTUAL_SCROLL_THRESHOLD = 50

// Row heights for virtual scrolling
const TABLE_ROW_HEIGHT = 73 // px
const CARD_HEIGHT = 140 // px

// Helper functions for badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-success/10 text-success"
    case "Pending Client Review":
      return "bg-warning/10 text-warning"
    case "Needs Discussion":
      return "bg-destructive/10 text-destructive"
    case "Internal Review":
      return "bg-primary/10 text-primary"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Must Have":
      return "bg-destructive/10 text-destructive"
    case "Should Have":
      return "bg-warning/10 text-warning"
    case "Could Have":
      return "bg-primary/10 text-primary"
    default:
      return "bg-muted text-muted-foreground"
  }
}

// Mobile Card Component
function StoryCard({ story, programs }: { story: Story; programs: Program[] }) {
  return (
    <Link
      href={`/stories/${story.story_id}`}
      className="block rounded-lg bg-card shadow-sm border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {story.title}
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            {story.story_id}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(story.status)}`}>
          {story.status}
        </span>
        {story.priority && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(story.priority)}`}>
            {story.priority}
          </span>
        )}
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Layers className="h-3 w-3" />
          {programs.find((p) => p.program_id === story.program_id)?.name || story.program_id}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(story.updated_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  )
}

// Desktop Table Row Component
function StoryTableRow({ story, programs }: { story: Story; programs: Program[] }) {
  return (
    <tr className="hover:bg-muted/50 transition-colors border-b border-border last:border-b-0">
      <td className="px-6 py-4">
        <Link href={`/stories/${story.story_id}`} className="block">
          <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            {story.title}
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            {story.story_id}
          </p>
        </Link>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-foreground">
          {programs.find((p) => p.program_id === story.program_id)?.name || story.program_id}
        </span>
      </td>
      <td className="px-6 py-4">
        {story.priority && (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(story.priority)}`}>
            {story.priority}
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(story.status)}`}>
          {story.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted-foreground">
          {story.roadmap_target || "—"}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted-foreground">
          {new Date(story.updated_at).toLocaleDateString()}
        </span>
      </td>
    </tr>
  )
}

export function StoriesList({ stories, programs }: StoriesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [programFilter, setProgramFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")

  // Refs for virtual scroll containers
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const cardContainerRef = useRef<HTMLDivElement>(null)

  // Filter stories based on all criteria
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      // Search filter - check title, story_id, and user_story
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        searchQuery === "" ||
        story.title.toLowerCase().includes(searchLower) ||
        story.story_id.toLowerCase().includes(searchLower) ||
        (story.user_story && story.user_story.toLowerCase().includes(searchLower))

      // Program filter
      const matchesProgram =
        programFilter === "" || story.program_id === programFilter

      // Status filter
      const matchesStatus =
        statusFilter === "" || story.status === statusFilter

      // Priority filter
      const matchesPriority =
        priorityFilter === "" || story.priority === priorityFilter

      return matchesSearch && matchesProgram && matchesStatus && matchesPriority
    })
  }, [stories, searchQuery, programFilter, statusFilter, priorityFilter])

  // Determine if virtual scrolling should be used
  const useVirtualScroll = filteredStories.length > VIRTUAL_SCROLL_THRESHOLD

  // Virtual scrolling for table (desktop)
  const tableVirtualizer = useVirtualizer({
    count: filteredStories.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => TABLE_ROW_HEIGHT,
    overscan: 5,
  })

  // Virtual scrolling for cards (mobile)
  const cardVirtualizer = useVirtualizer({
    count: filteredStories.length,
    getScrollElement: () => cardContainerRef.current,
    estimateSize: () => CARD_HEIGHT,
    overscan: 3,
  })

  // Get counts for filter badges
  const filterCounts = useMemo(() => {
    return {
      total: stories.length,
      filtered: filteredStories.length,
    }
  }, [stories.length, filteredStories.length])

  const clearFilters = () => {
    setSearchQuery("")
    setProgramFilter("")
    setStatusFilter("")
    setPriorityFilter("")
  }

  const hasActiveFilters =
    searchQuery || programFilter || statusFilter || priorityFilter

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Programs</option>
            {programs.map((program) => (
              <option key={program.program_id} value={program.program_id}>
                {program.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Internal Review">Internal Review</option>
            <option value="Pending Client Review">Pending Client Review</option>
            <option value="Approved">Approved</option>
            <option value="Needs Discussion">Needs Discussion</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Priorities</option>
            <option value="Must Have">Must Have</option>
            <option value="Should Have">Should Have</option>
            <option value="Could Have">Could Have</option>
            <option value="Won't Have">Won&apos;t Have</option>
          </select>
        </div>
      </div>

      {/* Filter status bar */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Showing {filterCounts.filtered} of {filterCounts.total} stories
          {useVirtualScroll && (
            <span className="ml-2 text-xs text-primary">(virtual scroll active)</span>
          )}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-primary hover:text-primary/80 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {filteredStories.length > 0 ? (
          useVirtualScroll ? (
            // Virtual scrolling for mobile
            <div
              ref={cardContainerRef}
              className="h-[calc(100vh-280px)] overflow-auto"
            >
              <div
                style={{
                  height: `${cardVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {cardVirtualizer.getVirtualItems().map((virtualItem) => {
                  const story = filteredStories[virtualItem.index]
                  return (
                    <div
                      key={story.story_id}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                        padding: "6px 0",
                      }}
                    >
                      <StoryCard story={story} programs={programs} />
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            // Regular rendering for small lists
            <div className="space-y-3">
              {filteredStories.map((story) => (
                <StoryCard key={story.story_id} story={story} programs={programs} />
              ))}
            </div>
          )
        ) : (
          <div className="rounded-lg bg-card shadow-sm border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No stories match your filters. Try adjusting your search criteria."
                : "No stories found. Create your first story to get started."}
            </p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg bg-card shadow-sm border border-border overflow-hidden">
        {filteredStories.length > 0 ? (
          <>
            {/* Table Header - always visible */}
            <table className="min-w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[35%]">
                    Story
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[12%]">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[12%]">
                    Roadmap
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[11%]">
                    Updated
                  </th>
                </tr>
              </thead>
            </table>

            {useVirtualScroll ? (
              // Virtual scrolling for desktop table
              <div
                ref={tableContainerRef}
                className="h-[calc(100vh-320px)] overflow-auto"
              >
                <div
                  style={{
                    height: `${tableVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  <table className="min-w-full">
                    <tbody>
                      {tableVirtualizer.getVirtualItems().map((virtualItem) => {
                        const story = filteredStories[virtualItem.index]
                        return (
                          <tr
                            key={story.story_id}
                            className="hover:bg-muted/50 transition-colors border-b border-border"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                              display: "table",
                              tableLayout: "fixed",
                            }}
                          >
                            <td className="px-6 py-4 w-[35%]">
                              <Link href={`/stories/${story.story_id}`} className="block">
                                <p className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate">
                                  {story.title}
                                </p>
                                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                                  {story.story_id}
                                </p>
                              </Link>
                            </td>
                            <td className="px-6 py-4 w-[15%]">
                              <span className="text-sm text-foreground truncate block">
                                {programs.find((p) => p.program_id === story.program_id)?.name || story.program_id}
                              </span>
                            </td>
                            <td className="px-6 py-4 w-[12%]">
                              {story.priority && (
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(story.priority)}`}>
                                  {story.priority}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 w-[15%]">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(story.status)}`}>
                                {story.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 w-[12%]">
                              <span className="text-sm text-muted-foreground">
                                {story.roadmap_target || "—"}
                              </span>
                            </td>
                            <td className="px-6 py-4 w-[11%]">
                              <span className="text-sm text-muted-foreground">
                                {new Date(story.updated_at).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Regular table rendering for small lists
              <table className="min-w-full">
                <tbody className="bg-card divide-y divide-border">
                  {filteredStories.map((story) => (
                    <StoryTableRow key={story.story_id} story={story} programs={programs} />
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <table className="min-w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Story
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Roadmap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? "No stories match your filters. Try adjusting your search criteria."
                      : "No stories found. Create your first story to get started."}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
