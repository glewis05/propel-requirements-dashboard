"use client"

import { useState } from "react"
import type { TestStep } from "@/types/database"
import { Plus, Trash2, GripVertical } from "lucide-react"

interface TestStepEditorProps {
  steps: TestStep[]
  onChange: (steps: TestStep[]) => void
  readOnly?: boolean
}

export function TestStepEditor({ steps, onChange, readOnly = false }: TestStepEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const addStep = () => {
    const newStep: TestStep = {
      step_number: steps.length + 1,
      action: "",
      expected_result: "",
    }
    onChange([...steps, newStep])
  }

  const removeStep = (index: number) => {
    const updated = steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step_number: i + 1 }))
    onChange(updated)
  }

  const updateStep = (index: number, field: keyof TestStep, value: string) => {
    const updated = steps.map((step, i) => {
      if (i === index) {
        return { ...step, [field]: value }
      }
      return step
    })
    onChange(updated)
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    const updated = [...steps]
    const [removed] = updated.splice(dragIndex, 1)
    updated.splice(index, 0, removed)

    // Renumber
    const renumbered = updated.map((step, i) => ({ ...step, step_number: i + 1 }))
    onChange(renumbered)
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Test Steps</label>
        {!readOnly && (
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            Add Step
          </button>
        )}
      </div>

      {steps.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">No test steps yet</p>
          {!readOnly && (
            <button
              type="button"
              onClick={addStep}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Add your first step
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              draggable={!readOnly}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`rounded-lg border bg-card p-3 ${
                dragIndex === index ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                {!readOnly && (
                  <div className="cursor-grab pt-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                  {step.step_number}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Action</label>
                    {readOnly ? (
                      <p className="text-sm mt-0.5">{step.action}</p>
                    ) : (
                      <textarea
                        value={step.action}
                        onChange={(e) => updateStep(index, "action", e.target.value)}
                        placeholder="What should the tester do?"
                        rows={2}
                        className="w-full rounded-md border bg-background px-3 py-1.5 text-sm resize-none"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Expected Result</label>
                    {readOnly ? (
                      <p className="text-sm mt-0.5">{step.expected_result}</p>
                    ) : (
                      <textarea
                        value={step.expected_result}
                        onChange={(e) => updateStep(index, "expected_result", e.target.value)}
                        placeholder="What should happen?"
                        rows={2}
                        className="w-full rounded-md border bg-background px-3 py-1.5 text-sm resize-none"
                      />
                    )}
                  </div>
                  {(step.notes || !readOnly) && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
                      {readOnly ? (
                        step.notes && <p className="text-sm mt-0.5 text-muted-foreground">{step.notes}</p>
                      ) : (
                        <input
                          type="text"
                          value={step.notes || ""}
                          onChange={(e) => updateStep(index, "notes", e.target.value)}
                          placeholder="Additional notes..."
                          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                        />
                      )}
                    </div>
                  )}
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
