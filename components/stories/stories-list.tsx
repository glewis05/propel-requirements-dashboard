"use client"

import { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { Search, ChevronRight, Calendar, Layers, X, FileText, Plus, Settings2 } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { getStatusBadge, getPriorityBadge } from "@/lib/badge-config"
import { ComplianceBadgeGroup } from "@/components/compliance"
import { RULE_TYPE_LABELS } from "@/lib/rule-update/constants"
import type { RuleType, StoryType } from "@/types/rule-update"

interface ComplianceFrameworkCount {
  code: string
  count: number
}

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
  compliance_frameworks?: ComplianceFrameworkCount[]
  story_type?: StoryType
  rule_type?: RuleType
  target_rule?: string
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
const CARD_HEIGHT = 160 // px - increased for rule badge

// Status badge component with icon
function StatusBadge({ status, size = "default" }: { status: string; size?: "default" | "sm" }) {
  const badge = getStatusBadge(status)
  const Icon = badge.icon
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2 py-1"
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${padding} text-xs font-medium ${badge.className}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  )
}

// Priority badge component with icon
function PriorityBadge({ priority, size = "default" }: { priority: string; size?: "default" | "sm" }) {
  const badge = getPriorityBadge(priority)
  const Icon = badge.icon
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2 py-1"
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${padding} text-xs font-medium ${badge.className}`}>
      <Icon className="h-3 w-3" />
      {priority}
    </span>
  )
}

// Rule type badge component
function RuleTypeBadge({ ruleType, targetRule, size = "default" }: { ruleType: RuleType; targetRule?: string; size?: "default" | "sm" }) {
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2 py-1"
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${padding} text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20`}>
      <Settings2 className="h-3 w-3" />
      {RULE_TYPE_LABELS[ruleType]}
      {targetRule && size !== "sm" && (
        <span className="font-mono text-secondary/70 ml-1">{targetRule}</span>
      )}
    </span>
  )
}

// Mobile Card Component
function StoryCard({ story, programs }: { story: Story; programs: Program[] }) {
  const isRuleUpdate = story.story_type === "rule_update"

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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs font-mono text-muted-foreground">
              {story.story_id}
            </p>
            {isRuleUpdate && story.target_rule && (
              <p className="text-xs font-mono text-secondary">
                {story.target_rule}
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        <StatusBadge status={story.status} size="sm" />
        {story.priority && (
          <PriorityBadge priority={story.priority} size="sm" />
        )}
        {isRuleUpdate && story.rule_type && (
          <RuleTypeBadge ruleType={story.rule_type} size="sm" />
        )}
        {story.compliance_frameworks && story.compliance_frameworks.length > 0 && (
          <ComplianceBadgeGroup
            frameworks={story.compliance_frameworks}
            size="sm"
            maxDisplay={2}
          />
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
  const isRuleUpdate = story.story_type === "rule_update"

  return (
    <tr className="hover:bg-muted/50 transition-colors border-b border-border last:border-b-0">
      <td className="px-6 py-4">
        <Link href={`/stories/${story.story_id}`} className="block">
          <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            {story.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs font-mono text-muted-foreground">
              {story.story_id}
            </p>
            {isRuleUpdate && story.rule_type && (
              <RuleTypeBadge ruleType={story.rule_type} targetRule={story.target_rule} size="sm" />
            )}
            {story.compliance_frameworks && story.compliance_frameworks.length > 0 && (
              <ComplianceBadgeGroup
                frameworks={story.compliance_frameworks}
                size="sm"
                maxDisplay={3}
              />
            )}
          </div>
        </Link>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-foreground">
          {programs.find((p) => p.program_id === story.program_id)?.name || story.program_id}
        </span>
      </td>
      <td className="px-6 py-4">
        {story.priority && (
          <PriorityBadge priority={story.priority} />
        )}
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={story.status} />
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-muted-foreground">
          {isRuleUpdate ? (story.target_rule || "\u2014") : (story.roadmap_target || "\u2014")}
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

// Empty state component
function EmptyState({ hasActiveFilters, onClearFilters }: { hasActiveFilters: boolean; onClearFilters: () => void }) {
  if (hasActiveFilters) {
    return (
      <div className="flex flex-col items-center py-12 px-6">
        <Search className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-sm font-medium text-foreground">No matching stories</h3>
        <p className="mt-1 text-sm text-muted-foreground text-center">
          Try adjusting your filters or search criteria.
        </p>
        <button
          onClick={onClearFilters}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <X className="h-4 w-4" />
          Clear all filters
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-12 px-6">
      <FileText className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-sm font-medium text-foreground">No stories yet</h3>
      <p className="mt-1 text-sm text-muted-foreground text-center">
        Create your first user story to get started.
      </p>
      <Link
        href="/stories/new"
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        New Story
      </Link>
    </div>
  )
}

export function StoriesList({ stories, programs }: StoriesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [programFilter, setProgramFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [storyTypeFilter, setStoryTypeFilter] = useState("")

  // Refs for virtual scroll containers
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const cardContainerRef = useRef<HTMLDivElement>(null)

  // Filter stories based on all criteria
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      // Search filter - check title, story_id, user_story, and target_rule
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        searchQuery === "" ||
        story.title.toLowerCase().includes(searchLower) ||
        story.story_id.toLowerCase().includes(searchLower) ||
        (story.user_story && story.user_story.toLowerCase().includes(searchLower)) ||
        (story.target_rule && story.target_rule.toLowerCase().includes(searchLower))

      // Program filter
      const matchesProgram =
        programFilter === "" || story.program_id === programFilter

      // Status filter
      const matchesStatus =
        statusFilter === "" || story.status === statusFilter

      // Priority filter
      const matchesPriority =
        priorityFilter === "" || story.priority === priorityFilter

      // Story type filter
      const matchesStoryType =
        storyTypeFilter === "" ||
        (storyTypeFilter === "user_story" && (story.story_type === "user_story" || !story.story_type)) ||
        (storyTypeFilter === "rule_update" && story.story_type === "rule_update")

      return matchesSearch && matchesProgram && matchesStatus && matchesPriority && matchesStoryType
    })
  }, [stories, searchQuery, programFilter, statusFilter, priorityFilter, storyTypeFilter])

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
    setStoryTypeFilter("")
  }

  const hasActiveFilters =
    searchQuery || programFilter || statusFilter || priorityFilter || storyTypeFilter

  // Build active filter chips
  const activeFilterChips: { label: string; value: string; onClear: () => void }[] = []
  if (searchQuery) {
    activeFilterChips.push({
      label: "Search",
      value: searchQuery,
      onClear: () => setSearchQuery(""),
    })
  }
  if (programFilter) {
    const programName = programs.find((p) => p.program_id === programFilter)?.name || programFilter
    activeFilterChips.push({
      label: "Program",
      value: programName,
      onClear: () => setProgramFilter(""),
    })
  }
  if (statusFilter) {
    activeFilterChips.push({
      label: "Status",
      value: statusFilter,
      onClear: () => setStatusFilter(""),
    })
  }
  if (priorityFilter) {
    activeFilterChips.push({
      label: "Priority",
      value: priorityFilter,
      onClear: () => setPriorityFilter(""),
    })
  }
  if (storyTypeFilter) {
    activeFilterChips.push({
      label: "Type",
      value: storyTypeFilter === "user_story" ? "User Story" : "Rule Update",
      onClear: () => setStoryTypeFilter(""),
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, ID, description, or rule..."
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
            value={storyTypeFilter}
            onChange={(e) => setStoryTypeFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Types</option>
            <option value="user_story">User Stories</option>
            <option value="rule_update">Rule Updates</option>
          </select>
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
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
          >
            <X className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilterChips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"
            >
              <span className="text-primary/70">{chip.label}:</span>
              <span className="max-w-[120px] truncate">{chip.value}</span>
              <button
                onClick={chip.onClear}
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

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
          <div className="rounded-lg bg-card shadow-sm border border-border">
            <EmptyState hasActiveFilters={!!hasActiveFilters} onClearFilters={clearFilters} />
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
                    Target
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
                        const isRuleUpdate = story.story_type === "rule_update"
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
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <p className="text-xs font-mono text-muted-foreground">
                                    {story.story_id}
                                  </p>
                                  {isRuleUpdate && story.rule_type && (
                                    <RuleTypeBadge ruleType={story.rule_type} size="sm" />
                                  )}
                                  {story.compliance_frameworks && story.compliance_frameworks.length > 0 && (
                                    <ComplianceBadgeGroup
                                      frameworks={story.compliance_frameworks}
                                      size="sm"
                                      maxDisplay={2}
                                    />
                                  )}
                                </div>
                              </Link>
                            </td>
                            <td className="px-6 py-4 w-[15%]">
                              <span className="text-sm text-foreground truncate block">
                                {programs.find((p) => p.program_id === story.program_id)?.name || story.program_id}
                              </span>
                            </td>
                            <td className="px-6 py-4 w-[12%]">
                              {story.priority && (
                                <PriorityBadge priority={story.priority} />
                              )}
                            </td>
                            <td className="px-6 py-4 w-[15%]">
                              <StatusBadge status={story.status} />
                            </td>
                            <td className="px-6 py-4 w-[12%]">
                              <span className="text-sm text-muted-foreground">
                                {isRuleUpdate ? (story.target_rule || "\u2014") : (story.roadmap_target || "\u2014")}
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
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6}>
                  <EmptyState hasActiveFilters={!!hasActiveFilters} onClearFilters={clearFilters} />
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
