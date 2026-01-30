"use client"

import { useState, useEffect } from "react"
import { X, Save, Loader2 } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers-v4/zod"
import {
  PLATFORMS,
  TEST_TYPES,
  TEST_CASE_STATUS,
  PLATFORM_LABELS,
  TEST_TYPE_LABELS,
  TEST_CASE_STATUS_LABELS,
  PATIENT_CONDITION_LABELS,
} from "@/lib/rule-update/constants"
import { ruleTestCaseSchema, type RuleTestCaseFormData, extractRuleCode, formatProfileId } from "@/lib/validations/rule-update"
import { RuleTestStepsEditor } from "./rule-test-steps-editor"
import type { RuleTestCase, RuleTestStep } from "@/types/rule-update"
import { getNextTestSequence } from "@/app/(dashboard)/stories/rule-update-actions"

interface RuleTestCaseEditorProps {
  storyId: string
  targetRule: string
  testCase?: RuleTestCase
  onSave: (data: RuleTestCaseFormData) => Promise<void>
  onCancel: () => void
}

export function RuleTestCaseEditor({
  storyId,
  targetRule,
  testCase,
  onSave,
  onCancel,
}: RuleTestCaseEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [previewProfileId, setPreviewProfileId] = useState<string | null>(null)

  const isEditing = !!testCase

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RuleTestCaseFormData>({
    resolver: zodResolver(ruleTestCaseSchema),
    defaultValues: testCase
      ? {
          platform: testCase.platform,
          test_type: testCase.test_type,
          patient_conditions: testCase.patient_conditions,
          expected_result: testCase.expected_result || "",
          cross_trigger_check: testCase.cross_trigger_check || "",
          test_steps: testCase.test_steps || [],
          status: testCase.status,
        }
      : {
          platform: PLATFORMS.P4M,
          test_type: TEST_TYPES.POS,
          patient_conditions: {},
          expected_result: "",
          cross_trigger_check: "",
          test_steps: [],
          status: TEST_CASE_STATUS.DRAFT,
        },
  })

  const watchPlatform = watch("platform")
  const watchTestType = watch("test_type")

  // Generate preview profile ID when platform or test type changes
  useEffect(() => {
    if (!isEditing && targetRule) {
      const fetchSequence = async () => {
        const result = await getNextTestSequence(storyId, watchPlatform, watchTestType)
        if (result.success && result.sequence) {
          const ruleCode = extractRuleCode(targetRule)
          const preview = formatProfileId(ruleCode, watchTestType, result.sequence, watchPlatform)
          setPreviewProfileId(preview)
        }
      }
      fetchSequence()
    }
  }, [storyId, targetRule, watchPlatform, watchTestType, isEditing])

  const onSubmit = async (data: RuleTestCaseFormData) => {
    setIsSaving(true)
    try {
      await onSave(data)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? "Edit Test Case" : "Add Test Case"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Profile ID Preview (for new test cases) */}
            {!isEditing && previewProfileId && (
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <label className="text-xs font-medium text-muted-foreground">
                  Profile ID (auto-generated)
                </label>
                <p className="font-mono text-sm text-foreground mt-1">
                  {previewProfileId}
                </p>
              </div>
            )}

            {/* Existing Profile ID (for editing) */}
            {isEditing && testCase && (
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <label className="text-xs font-medium text-muted-foreground">
                  Profile ID
                </label>
                <p className="font-mono text-sm text-foreground mt-1">
                  {testCase.profile_id}
                </p>
              </div>
            )}

            {/* Platform and Test Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Platform <span className="text-destructive">*</span>
                </label>
                <select
                  {...register("platform")}
                  disabled={isEditing}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:bg-muted"
                >
                  {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label} ({value})
                    </option>
                  ))}
                </select>
                {errors.platform && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.platform.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Test Type <span className="text-destructive">*</span>
                </label>
                <select
                  {...register("test_type")}
                  disabled={isEditing}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:bg-muted"
                >
                  {Object.entries(TEST_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.test_type && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.test_type.message}
                  </p>
                )}
              </div>
            </div>

            {/* Patient Conditions */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Patient Conditions
              </label>
              <div className="mt-2 space-y-2">
                {Object.entries(PATIENT_CONDITION_LABELS).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground">{label}</label>
                    <input
                      type="text"
                      {...register(`patient_conditions.${key}`)}
                      placeholder={`${label} condition...`}
                      className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Result */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Expected Result
              </label>
              <input
                type="text"
                {...register("expected_result")}
                placeholder="e.g., Rule triggers"
                className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Cross Trigger Check */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Cross Trigger Check
              </label>
              <input
                type="text"
                {...register("cross_trigger_check")}
                placeholder="e.g., NCCN-PROS-009 if FDR also aggressive"
                className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Test Steps */}
            <Controller
              name="test_steps"
              control={control}
              render={({ field }) => (
                <RuleTestStepsEditor
                  steps={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                {...register("status")}
                className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(TEST_CASE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? "Save Changes" : "Add Test Case"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
