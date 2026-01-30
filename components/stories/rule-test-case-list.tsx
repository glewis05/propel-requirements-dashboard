"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, FlaskConical } from "lucide-react"
import {
  PLATFORM_LABELS,
  TEST_TYPE_LABELS,
  TEST_TYPE_COLORS,
  TEST_CASE_STATUS_LABELS,
  TEST_CASE_STATUS_COLORS,
  PATIENT_CONDITION_LABELS,
} from "@/lib/rule-update/constants"
import type { RuleTestCase, RuleTestStep } from "@/types/rule-update"
import type { RuleTestCaseFormData } from "@/lib/validations/rule-update"
import { RuleTestCaseEditor } from "./rule-test-case-editor"
import {
  addRuleTestCase,
  updateRuleTestCase,
  deleteRuleTestCase,
} from "@/app/(dashboard)/stories/rule-update-actions"

interface RuleTestCaseListProps {
  storyId: string
  targetRule: string
  testCases: RuleTestCase[]
  onUpdate?: () => void
  readOnly?: boolean
}

export function RuleTestCaseList({
  storyId,
  targetRule,
  testCases,
  onUpdate,
  readOnly = false,
}: RuleTestCaseListProps) {
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set())
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<RuleTestCase | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const toggleExpand = (testId: string) => {
    const newExpanded = new Set(expandedCases)
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId)
    } else {
      newExpanded.add(testId)
    }
    setExpandedCases(newExpanded)
  }

  const handleAddClick = () => {
    setEditingCase(undefined)
    setEditorOpen(true)
  }

  const handleEditClick = (testCase: RuleTestCase) => {
    setEditingCase(testCase)
    setEditorOpen(true)
  }

  const handleDeleteClick = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test case?")) {
      return
    }
    setDeletingId(testId)
    try {
      const result = await deleteRuleTestCase(testId)
      if (result.success) {
        onUpdate?.()
      } else {
        alert(result.error || "Failed to delete test case")
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleSave = async (data: RuleTestCaseFormData) => {
    if (editingCase) {
      const result = await updateRuleTestCase(editingCase.test_id, data)
      if (result.success) {
        setEditorOpen(false)
        setEditingCase(undefined)
        onUpdate?.()
      } else {
        alert(result.error || "Failed to update test case")
      }
    } else {
      const result = await addRuleTestCase(storyId, data)
      if (result.success) {
        setEditorOpen(false)
        onUpdate?.()
      } else {
        alert(result.error || "Failed to add test case")
      }
    }
  }

  // Group test cases by platform
  const groupedCases = testCases.reduce(
    (acc, tc) => {
      if (!acc[tc.platform]) {
        acc[tc.platform] = []
      }
      acc[tc.platform].push(tc)
      return acc
    },
    {} as Record<string, RuleTestCase[]>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Test Cases</h3>
          <span className="text-sm text-muted-foreground">
            ({testCases.length})
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={handleAddClick}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Test Case
          </button>
        )}
      </div>

      {/* Test Cases */}
      {testCases.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <FlaskConical className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No test cases defined yet
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddClick}
              className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add your first test case
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedCases).map(([platform, cases]) => (
            <div key={platform} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] || platform}
              </h4>
              <div className="space-y-2">
                {cases.map((tc) => (
                  <TestCaseCard
                    key={tc.test_id}
                    testCase={tc}
                    expanded={expandedCases.has(tc.test_id)}
                    onToggle={() => toggleExpand(tc.test_id)}
                    onEdit={() => handleEditClick(tc)}
                    onDelete={() => handleDeleteClick(tc.test_id)}
                    isDeleting={deletingId === tc.test_id}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {editorOpen && (
        <RuleTestCaseEditor
          storyId={storyId}
          targetRule={targetRule}
          testCase={editingCase}
          onSave={handleSave}
          onCancel={() => {
            setEditorOpen(false)
            setEditingCase(undefined)
          }}
        />
      )}
    </div>
  )
}

interface TestCaseCardProps {
  testCase: RuleTestCase
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
  readOnly: boolean
}

function TestCaseCard({
  testCase,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
  readOnly,
}: TestCaseCardProps) {
  const testTypeColor = TEST_TYPE_COLORS[testCase.test_type] || ""
  const statusColor = TEST_CASE_STATUS_COLORS[testCase.status] || ""

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Card Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30"
        onClick={onToggle}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-medium text-foreground">
              {testCase.profile_id}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${testTypeColor}`}
            >
              {TEST_TYPE_LABELS[testCase.test_type]}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}
            >
              {TEST_CASE_STATUS_LABELS[testCase.status]}
            </span>
          </div>
          {testCase.expected_result && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Expected: {testCase.expected_result}
            </p>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 border-t border-border bg-muted/20 space-y-4">
          {/* Patient Conditions */}
          {testCase.patient_conditions &&
            Object.keys(testCase.patient_conditions).length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Patient Conditions
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(testCase.patient_conditions).map(
                    ([key, value]) =>
                      value && (
                        <div key={key} className="bg-background p-2 rounded border border-border">
                          <span className="text-xs text-muted-foreground">
                            {PATIENT_CONDITION_LABELS[key] || key}
                          </span>
                          <p className="text-sm text-foreground">{value}</p>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

          {/* Expected Result & Cross Trigger */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testCase.expected_result && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Expected Result
                </h5>
                <p className="text-sm text-foreground">{testCase.expected_result}</p>
              </div>
            )}
            {testCase.cross_trigger_check && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Cross Trigger Check
                </h5>
                <p className="text-sm text-foreground">{testCase.cross_trigger_check}</p>
              </div>
            )}
          </div>

          {/* Test Steps */}
          {testCase.test_steps && testCase.test_steps.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Test Steps ({testCase.test_steps.length})
              </h5>
              <div className="space-y-2">
                {testCase.test_steps.map((step: RuleTestStep, index: number) => (
                  <div
                    key={index}
                    className="flex gap-3 bg-background p-2 rounded border border-border"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                      {step.step_number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">
                          {step.navigation_path}
                        </span>
                        {" → "}
                        <span className="font-medium">{step.action}</span>
                      </p>
                      {step.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">
                          {step.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
