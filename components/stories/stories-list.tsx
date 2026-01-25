"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

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

export function StoriesList({ stories, programs }: StoriesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [programFilter, setProgramFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")

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
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
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

      {/* Stories Table */}
      <div className="rounded-lg bg-card shadow-sm border border-border overflow-hidden">
        <table className="min-w-full divide-y divide-border">
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
          <tbody className="bg-card divide-y divide-border">
            {filteredStories.length > 0 ? (
              filteredStories.map((story) => (
                <tr
                  key={story.story_id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/stories/${story.story_id}`}
                      className="block"
                    >
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
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          story.priority === "Must Have"
                            ? "bg-destructive/10 text-destructive"
                            : story.priority === "Should Have"
                            ? "bg-warning/10 text-warning"
                            : story.priority === "Could Have"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {story.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        story.status === "Approved"
                          ? "bg-success/10 text-success"
                          : story.status === "Pending Client Review"
                          ? "bg-warning/10 text-warning"
                          : story.status === "Needs Discussion"
                          ? "bg-destructive/10 text-destructive"
                          : story.status === "Internal Review"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
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
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? "No stories match your filters. Try adjusting your search criteria."
                      : "No stories found. Create your first story to get started."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
