"use client"

import { useState, useEffect } from "react"
import { Sparkles, Loader2, RefreshCw, Check, X, AlertCircle } from "lucide-react"
import { generateAcceptanceCriteria, checkAIAvailability } from "@/app/(dashboard)/stories/ai-actions"
import type { AcceptanceCriteriaSuggestion } from "@/lib/ai/types"

interface AIAcceptanceCriteriaProps {
  storyTitle: string
  storyDescription: string
  userType?: string
  programName?: string
  onAccept: (criteria: string) => void
}

export function AIAcceptanceCriteria({
  storyTitle,
  storyDescription,
  userType,
  programName,
  onAccept,
}: AIAcceptanceCriteriaProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AcceptanceCriteriaSuggestion[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [showPanel, setShowPanel] = useState(false)

  // Check AI availability on mount
  useEffect(() => {
    checkAIAvailability().then(setIsAvailable)
  }, [])

  // Don't render if AI is not available
  if (isAvailable === null) {
    return null // Loading state
  }

  if (!isAvailable) {
    return null // AI not configured, hide the feature
  }

  const canGenerate = storyTitle.trim().length >= 5

  const handleGenerate = async () => {
    if (!canGenerate) {
      setError("Please provide a story title with at least 5 characters.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuggestions([])
    setSelectedIndices(new Set())
    setShowPanel(true)

    const result = await generateAcceptanceCriteria({
      title: storyTitle,
      description: storyDescription,
      userType,
      programName,
    })

    setIsLoading(false)

    if (result.success && result.suggestions) {
      setSuggestions(result.suggestions)
      // Select all by default
      setSelectedIndices(new Set(result.suggestions.map((_, i) => i)))
    } else {
      setError(result.error || "Failed to generate suggestions")
    }
  }

  const handleToggleSelect = (index: number) => {
    const newSelected = new Set(selectedIndices)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedIndices(newSelected)
  }

  const handleSelectAll = () => {
    setSelectedIndices(new Set(suggestions.map((_, i) => i)))
  }

  const handleDeselectAll = () => {
    setSelectedIndices(new Set())
  }

  const handleAcceptSelected = () => {
    const selectedCriteria = suggestions
      .filter((_, i) => selectedIndices.has(i))
      .map((s) => s.criteria)
      .join("\n\n")

    if (selectedCriteria) {
      onAccept(selectedCriteria)
      setShowPanel(false)
      setSuggestions([])
      setSelectedIndices(new Set())
    }
  }

  const handleClose = () => {
    setShowPanel(false)
    setSuggestions([])
    setSelectedIndices(new Set())
    setError(null)
  }

  return (
    <div className="space-y-3">
      {/* Generate Button */}
      {!showPanel && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || isLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </button>
      )}

      {/* Suggestions Panel */}
      {showPanel && (
        <div className="border border-primary/30 rounded-lg bg-primary/5 p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                AI Suggested Acceptance Criteria
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
                Generating acceptance criteria...
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
                  onClick={handleGenerate}
                  className="mt-2 text-sm text-destructive hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <>
              {/* Selection Controls */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {selectedIndices.size} of {suggestions.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="hover:text-foreground transition-colors"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="hover:text-foreground transition-colors"
                >
                  Deselect all
                </button>
              </div>

              {/* Criteria List */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <label
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedIndices.has(index)
                        ? "bg-background border-primary/40"
                        : "bg-background/50 border-border hover:border-primary/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIndices.has(index)}
                      onChange={() => handleToggleSelect(index)}
                      className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
                    />
                    <pre className="flex-1 text-sm text-foreground whitespace-pre-wrap font-sans">
                      {suggestion.criteria}
                    </pre>
                  </label>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={handleAcceptSelected}
                  disabled={selectedIndices.size === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-4 w-4" />
                  Accept Selected ({selectedIndices.size})
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
