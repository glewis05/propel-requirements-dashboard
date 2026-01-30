"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Loader2,
  X,
  AlertCircle,
  Plus,
  GitBranch,
  Link2,
  Check,
} from "lucide-react"
import {
  getRelationshipSuggestions,
  checkAIAvailability,
} from "@/app/(dashboard)/stories/ai-actions"
import { updateStory } from "@/app/(dashboard)/stories/actions"
import type { RelationshipSuggestion } from "@/lib/ai/types"

interface AIRelationshipSuggestionsProps {
  /** Story ID - optional for create mode */
  storyId?: string
  storyTitle: string
  storyDescription: string
  currentRelatedStories: string[]
  currentParentStoryId: string | null
  /** Program ID - required for create mode to filter suggestions */
  programId?: string
  /** Optional callback for form integration - when provided, updates form state instead of making API calls */
  onAddRelated?: (storyId: string) => void
  /** Set parent story callback for form integration */
  onSetParent?: (storyId: string) => void
}

export function AIRelationshipSuggestions({
  storyId,
  storyTitle,
  storyDescription,
  currentRelatedStories,
  currentParentStoryId,
  programId,
  onAddRelated,
  onSetParent,
}: AIRelationshipSuggestionsProps) {
  const router = useRouter()
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<RelationshipSuggestion[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  // Check AI availability on mount
  useEffect(() => {
    checkAIAvailability().then(setIsAvailable)
  }, [])

  // Don't render if AI is not available
  if (isAvailable === null) {
    return null
  }

  if (!isAvailable) {
    return null
  }

  const handleGenerateSuggestions = async () => {
    setIsLoading(true)
    setError(null)
    setSuggestions([])
    setShowPanel(true)
    setAddedIds(new Set())

    const result = await getRelationshipSuggestions(storyId || null, {
      title: storyTitle,
      description: storyDescription,
      programId,
      existingRelated: currentRelatedStories,
    })

    setIsLoading(false)

    if (result.success && result.suggestions) {
      setSuggestions(result.suggestions)
    } else {
      setError(result.error || "Failed to generate suggestions")
    }
  }

  const handleAddRelationship = async (suggestion: RelationshipSuggestion) => {
    setAddingIds((prev) => new Set(prev).add(suggestion.story_id))

    try {
      // Handle parent relationship type with callback
      if (suggestion.relationship_type === "parent" && onSetParent) {
        onSetParent(suggestion.story_id)
        setAddedIds((prev) => new Set(prev).add(suggestion.story_id))
        return
      }

      // If callback provided (form mode), use it instead of API call
      if (onAddRelated) {
        onAddRelated(suggestion.story_id)
        setAddedIds((prev) => new Set(prev).add(suggestion.story_id))
        return
      }

      // For display mode (no callbacks), make API call
      if (!storyId) {
        setError("Cannot add relationships in create mode without form callbacks")
        return
      }

      const newRelatedStories = [...currentRelatedStories, suggestion.story_id]

      // Make an API call to update related_stories
      const result = await fetch(`/api/stories/${storyId}/relationships`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          related_stories: newRelatedStories,
        }),
      })

      if (result.ok) {
        setAddedIds((prev) => new Set(prev).add(suggestion.story_id))
        router.refresh()
      } else {
        const data = await result.json()
        setError(data.error || "Failed to add relationship")
      }
    } catch {
      setError("Failed to add relationship")
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev)
        next.delete(suggestion.story_id)
        return next
      })
    }
  }

  const handleClose = () => {
    setShowPanel(false)
    setSuggestions([])
    setError(null)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-success"
    if (confidence >= 0.6) return "text-warning"
    return "text-muted-foreground"
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High"
    if (confidence >= 0.6) return "Medium"
    return "Low"
  }

  return (
    <div className="space-y-3">
      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerateSuggestions}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="h-4 w-4" />
        Suggest Related Stories
      </button>

      {/* Suggestions Panel */}
      {showPanel && (
        <div className="border border-primary/30 rounded-lg bg-primary/5 p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                AI Suggested Relationships
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                Analyzing story relationships...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive">{error}</p>
                <button
                  type="button"
                  onClick={handleGenerateSuggestions}
                  className="mt-2 text-sm text-destructive hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* No Suggestions */}
          {!isLoading && !error && suggestions.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">
              <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No related stories found.</p>
              <p className="text-xs mt-1">
                Try adding more details to this story or create more stories first.
              </p>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suggestions.map((suggestion) => {
                const isAdding = addingIds.has(suggestion.story_id)
                const isAdded = addedIds.has(suggestion.story_id)

                return (
                  <div
                    key={suggestion.story_id}
                    className="flex items-start gap-3 p-3 rounded-md bg-background border border-border"
                  >
                    {/* Relationship Type Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {suggestion.relationship_type === "parent" ? (
                        <GitBranch className="h-4 w-4 text-purple-500" />
                      ) : (
                        <Link2 className="h-4 w-4 text-blue-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground truncate">
                            {suggestion.story_title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {suggestion.story_id}
                          </p>
                        </div>
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              suggestion.relationship_type === "parent"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {suggestion.relationship_type === "parent"
                              ? "Parent"
                              : "Related"}
                          </span>
                          <span
                            className={`text-xs ${getConfidenceColor(
                              suggestion.confidence
                            )}`}
                          >
                            {getConfidenceLabel(suggestion.confidence)}
                          </span>
                        </div>
                      </div>

                      {/* Reason */}
                      <p className="text-xs text-muted-foreground mt-2">
                        {suggestion.reason}
                      </p>

                      {/* Add Button */}
                      <div className="mt-2">
                        {isAdded ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <Check className="h-3 w-3" />
                            Added
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddRelationship(suggestion)}
                            disabled={isAdding}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                          >
                            {isAdding ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                            {suggestion.relationship_type === "parent"
                              ? "Set as Parent"
                              : "Add as Related"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
