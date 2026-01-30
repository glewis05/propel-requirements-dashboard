"use client"

import { useState } from "react"
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import type { RuleTestStep } from "@/types/rule-update"

interface RuleTestStepsEditorProps {
  steps: RuleTestStep[]
  onChange: (steps: RuleTestStep[]) => void
  disabled?: boolean
}

export function RuleTestStepsEditor({
  steps,
  onChange,
  disabled = false,
}: RuleTestStepsEditorProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  const addStep = () => {
    const newStep: RuleTestStep = {
      step_number: steps.length + 1,
      navigation_path: "",
      action: "",
    }
    onChange([...steps, newStep])
    setExpandedStep(newStep.step_number)
  }

  const updateStep = (index: number, updates: Partial<RuleTestStep>) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], ...updates }
    onChange(newSteps)
  }

  const removeStep = (index: number) => {
    const newSteps = steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step_number: i + 1 }))
    onChange(newSteps)
    if (expandedStep === index + 1) {
      setExpandedStep(null)
    }
  }

  const moveStep = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === steps.length - 1)
    ) {
      return
    }

    const newSteps = [...steps]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newSteps[index], newSteps[targetIndex]] = [
      newSteps[targetIndex],
      newSteps[index],
    ]
    // Renumber steps
    newSteps.forEach((step, i) => {
      step.step_number = i + 1
    })
    onChange(newSteps)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Test Steps</label>
        <button
          type="button"
          onClick={addStep}
          disabled={disabled}
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
          Add Step
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">No test steps defined</p>
          <button
            type="button"
            onClick={addStep}
            disabled={disabled}
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add first step
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className="border border-border rounded-lg bg-card overflow-hidden"
            >
              {/* Step header */}
              <div
                className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer"
                onClick={() =>
                  setExpandedStep(expandedStep === index + 1 ? null : index + 1)
                }
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {step.step_number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {step.navigation_path || "Navigation path..."}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.action || "Action..."}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveStep(index, "up")
                    }}
                    disabled={disabled || index === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveStep(index, "down")
                    }}
                    disabled={disabled || index === steps.length - 1}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeStep(index)
                    }}
                    disabled={disabled}
                    className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded step details */}
              {expandedStep === index + 1 && (
                <div className="p-3 space-y-3 border-t border-border">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Navigation Path
                    </label>
                    <input
                      type="text"
                      value={step.navigation_path}
                      onChange={(e) =>
                        updateStep(index, { navigation_path: e.target.value })
                      }
                      disabled={disabled}
                      placeholder="e.g., Family History > Add Relative"
                      className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Action
                    </label>
                    <input
                      type="text"
                      value={step.action}
                      onChange={(e) =>
                        updateStep(index, { action: e.target.value })
                      }
                      disabled={disabled}
                      placeholder="e.g., Grandmother (Second Degree)"
                      className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={step.note || ""}
                      onChange={(e) =>
                        updateStep(index, { note: e.target.value || undefined })
                      }
                      disabled={disabled}
                      placeholder="e.g., SDR renal, not FDR"
                      className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
