"use client"

import { useState, useRef, useEffect } from "react"
import { X, Search, ChevronDown } from "lucide-react"

interface Story {
  story_id: string
  title: string
  program_id: string
  program_name?: string
}

interface RelatedStoriesSelectorProps {
  stories: Story[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  excludeId?: string // Exclude current story from selection
  placeholder?: string
}

export function RelatedStoriesSelector({
  stories,
  selectedIds,
  onChange,
  excludeId,
  placeholder = "Search and select related stories...",
}: RelatedStoriesSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter out excluded story and already selected stories
  const availableStories = stories.filter(
    (story) =>
      story.story_id !== excludeId &&
      !selectedIds.includes(story.story_id)
  )

  // Filter by search query
  const filteredStories = availableStories.filter(
    (story) =>
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.story_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get selected story objects for display
  const selectedStories = stories.filter((story) =>
    selectedIds.includes(story.story_id)
  )

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (storyId: string) => {
    onChange([...selectedIds, storyId])
    setSearchQuery("")
    inputRef.current?.focus()
  }

  const handleRemove = (storyId: string) => {
    onChange(selectedIds.filter((id) => id !== storyId))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && searchQuery === "" && selectedIds.length > 0) {
      // Remove last selected item on backspace when search is empty
      handleRemove(selectedIds[selectedIds.length - 1])
    }
    if (e.key === "Escape") {
      setIsOpen(false)
    }
    if (e.key === "Enter" && filteredStories.length > 0) {
      e.preventDefault()
      handleSelect(filteredStories[0].story_id)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips and search input */}
      <div
        className={`min-h-[42px] w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors ${
          isOpen
            ? "border-ring ring-2 ring-ring/20"
            : "border-input hover:border-muted-foreground/50"
        }`}
        onClick={() => {
          setIsOpen(true)
          inputRef.current?.focus()
        }}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {/* Selected story chips */}
          {selectedStories.map((story) => (
            <span
              key={story.story_id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
            >
              <span className="max-w-[150px] truncate" title={story.title}>
                {story.title}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(story.story_id)
                }}
                className="ml-1 hover:bg-primary/20 rounded p-0.5 transition-colors"
                aria-label={`Remove ${story.title}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {/* Search input */}
          <div className="flex-1 min-w-[120px] flex items-center gap-1">
            {selectedIds.length === 0 && !isOpen && (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={selectedIds.length === 0 ? placeholder : "Add more..."}
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
            />
          </div>

          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredStories.length > 0 ? (
            filteredStories.map((story) => (
              <button
                key={story.story_id}
                type="button"
                onClick={() => handleSelect(story.story_id)}
                className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground truncate">
                    {story.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {story.story_id}
                    {story.program_name && ` - ${story.program_name}`}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {searchQuery
                ? "No matching stories found"
                : availableStories.length === 0
                ? "No stories available to link"
                : "Type to search stories"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
