"use client"

import { useState } from "react"
import { Sparkles, Check, RefreshCw, Save, X } from "lucide-react"
import type { GeneratedTestCase } from "@/lib/ai/types"
import { generateTestCases, saveGeneratedTestCases } from "@/app/(dashboard)/validation/ai-actions"

interface AITestCaseGeneratorProps {
  storyId: string
  programId: string
  onSaved?: () => void
}

export function AITestCaseGenerator({ storyId, programId, onSaved }: AITestCaseGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedCases, setGeneratedCases] = useState<GeneratedTestCase[] | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setGeneratedCases(null)

    const result = await generateTestCases(storyId)

    if (result.success && result.testCases) {
      setGeneratedCases(result.testCases)
      // Select all by default
      setSelectedIndices(new Set(result.testCases.map((_, i) => i)))
    } else {
      setError(result.error || "Failed to generate test cases")
    }

    setIsGenerating(false)
  }

  const handleSave = async () => {
    if (!generatedCases) return

    const selected = generatedCases.filter((_, i) => selectedIndices.has(i))
    if (selected.length === 0) {
      setError("Please select at least one test case to save")
      return
    }

    setIsSaving(true)
    setError(null)

    const result = await saveGeneratedTestCases(storyId, programId, selected)

    if (result.success) {
      setGeneratedCases(null)
      setSelectedIndices(new Set())
      onSaved?.()
    } else {
      setError(result.error || "Failed to save test cases")
    }

    setIsSaving(false)
  }

  const toggleSelection = (index: number) => {
    const updated = new Set(selectedIndices)
    if (updated.has(index)) {
      updated.delete(index)
    } else {
      updated.add(index)
    }
    setSelectedIndices(updated)
  }

  const selectAll = () => {
    if (generatedCases) {
      setSelectedIndices(new Set(generatedCases.map((_, i) => i)))
    }
  }

  const deselectAll = () => {
    setSelectedIndices(new Set())
  }

  // Initial state - show generate button
  if (!generatedCases && !isGenerating) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Sparkles className="h-4 w-4" />
          Generate Test Cases with AI
        </button>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="rounded-lg border bg-violet-50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          <div>
            <p className="font-medium text-violet-900">Generating test cases...</p>
            <p className="text-sm text-violet-700">
              AI is analyzing the story requirements and creating comprehensive test cases
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Review generated test cases
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h3 className="font-medium">
              Generated {generatedCases?.length || 0} Test Cases
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:underline"
            >
              Select all
            </button>
            <span className="text-muted-foreground">/</span>
            <button
              onClick={deselectAll}
              className="text-xs text-primary hover:underline"
            >
              Deselect all
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Review and select the test cases you want to save. Selected: {selectedIndices.size} of {generatedCases?.length || 0}
        </p>
        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
      </div>

      <div className="max-h-[500px] overflow-y-auto divide-y">
        {generatedCases?.map((tc, index) => (
          <div
            key={index}
            className={`p-4 cursor-pointer transition-colors ${
              selectedIndices.has(index) ? "bg-primary/5" : "hover:bg-muted/50"
            }`}
            onClick={() => toggleSelection(index)}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                selectedIndices.has(index)
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              }`}>
                {selectedIndices.has(index) && <Check className="h-3 w-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{tc.title}</h4>
                  <span className="text-xs text-muted-foreground capitalize">
                    {tc.test_type}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {tc.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{tc.description}</p>
                {tc.preconditions && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Preconditions:</span> {tc.preconditions}
                  </p>
                )}
                <div className="mt-2 space-y-1">
                  {tc.test_steps.slice(0, 3).map((step) => (
                    <div key={step.step_number} className="text-xs text-muted-foreground">
                      <span className="font-medium">Step {step.step_number}:</span> {step.action}
                    </div>
                  ))}
                  {tc.test_steps.length > 3 && (
                    <p className="text-xs text-muted-foreground italic">
                      +{tc.test_steps.length - 3} more steps
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t p-4">
        <button
          onClick={handleSave}
          disabled={isSaving || selectedIndices.size === 0}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : `Save ${selectedIndices.size} Test Cases`}
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </button>
        <button
          onClick={() => {
            setGeneratedCases(null)
            setSelectedIndices(new Set())
          }}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  )
}
