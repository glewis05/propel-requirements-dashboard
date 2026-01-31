"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react"
import {
  ruleUpdateStorySchema,
  type RuleUpdateStoryFormData,
} from "@/lib/validations/rule-update"
import {
  RULE_TYPES,
  RULE_TYPE_LABELS,
  CHANGE_TYPES,
  CHANGE_TYPE_LABELS,
  generateQuarterOptions,
} from "@/lib/rule-update/constants"
import { STORY_STATUSES, STORY_PRIORITIES } from "@/lib/validations/story"

interface Program {
  program_id: string
  name: string
}

interface RuleUpdateFormProps {
  mode: "create" | "edit"
  programs: Program[]
  initialData?: Partial<RuleUpdateStoryFormData>
  onSubmit: (data: RuleUpdateStoryFormData) => Promise<{ success: boolean; error?: string; storyId?: string }>
}

export function RuleUpdateForm({
  mode,
  programs,
  initialData,
  onSubmit,
}: RuleUpdateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    ruleDetails: true,
    ruleContent: true,
  })

  const quarterOptions = generateQuarterOptions()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RuleUpdateStoryFormData>({
    resolver: zodResolver(ruleUpdateStorySchema),
    defaultValues: {
      title: initialData?.title || "",
      program_id: initialData?.program_id || "",
      status: initialData?.status || "Draft",
      priority: initialData?.priority || null,
      rule_details: {
        rule_type: initialData?.rule_details?.rule_type || "NCCN",
        target_rule: initialData?.rule_details?.target_rule || "",
        change_id: initialData?.rule_details?.change_id || "",
        change_type: initialData?.rule_details?.change_type || "MODIFIED",
        quarter: initialData?.rule_details?.quarter || quarterOptions[0],
        effective_date: initialData?.rule_details?.effective_date || null,
        rule_description: initialData?.rule_details?.rule_description || "",
        change_summary: initialData?.rule_details?.change_summary || "",
      },
    },
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleFormSubmit = async (data: RuleUpdateStoryFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await onSubmit(data)
      if (result.success && result.storyId) {
        router.push(`/stories/${result.storyId}`)
      } else {
        setSubmitError(result.error || "Failed to save rule update")
      }
    } catch (error) {
      setSubmitError("An unexpected error occurred")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const watchRuleType = watch("rule_details.rule_type")

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Banner */}
      {submitError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-destructive">
                Error saving rule update
              </h3>
              <p className="text-sm text-destructive/80 mt-1">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info Section */}
      <div className="rounded-lg bg-card shadow-sm border border-border p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-foreground">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            {...register("title")}
            placeholder="e.g., Update NCCN-PROS-007 for Q4 2025"
            className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.title && (
            <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Program and Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Program <span className="text-destructive">*</span>
            </label>
            <select
              {...register("program_id")}
              className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a program</option>
              {programs.map((program) => (
                <option key={program.program_id} value={program.program_id}>
                  {program.name}
                </option>
              ))}
            </select>
            {errors.program_id && (
              <p className="text-sm text-destructive mt-1">
                {errors.program_id.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Status <span className="text-destructive">*</span>
            </label>
            <select
              {...register("status")}
              className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STORY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-sm text-destructive mt-1">{errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm font-medium text-foreground">Priority</label>
          <select
            {...register("priority")}
            className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">No priority set</option>
            {STORY_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rule Details Section */}
      <div className="rounded-lg bg-card shadow-sm border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("ruleDetails")}
          className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-muted/30 transition-colors"
        >
          <h2 className="text-lg font-semibold text-foreground">Rule Details</h2>
          {expandedSections.ruleDetails ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.ruleDetails && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 border-t border-border pt-4">
            {/* Rule Type and Target Rule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Rule Type <span className="text-destructive">*</span>
                </label>
                <select
                  {...register("rule_details.rule_type")}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(RULE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.rule_details?.rule_type && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.rule_details.rule_type.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Target Rule <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  {...register("rule_details.target_rule")}
                  placeholder={watchRuleType === "TC" ? "TC-RISK-001" : "NCCN-PROS-007"}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
                {errors.rule_details?.target_rule && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.rule_details.target_rule.message}
                  </p>
                )}
              </div>
            </div>

            {/* Change ID and Change Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Change ID <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  {...register("rule_details.change_id")}
                  placeholder="e.g., 25Q4R-01"
                  className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
                {errors.rule_details?.change_id && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.rule_details.change_id.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Change Type <span className="text-destructive">*</span>
                </label>
                <select
                  {...register("rule_details.change_type")}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(CHANGE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.rule_details?.change_type && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.rule_details.change_type.message}
                  </p>
                )}
              </div>
            </div>

            {/* Quarter and Effective Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Quarter <span className="text-destructive">*</span>
                </label>
                <select
                  {...register("rule_details.quarter")}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {quarterOptions.map((quarter) => (
                    <option key={quarter} value={quarter}>
                      {quarter}
                    </option>
                  ))}
                </select>
                {errors.rule_details?.quarter && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.rule_details.quarter.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Effective Date
                </label>
                <input
                  type="date"
                  {...register("rule_details.effective_date")}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rule Content Section */}
      <div className="rounded-lg bg-card shadow-sm border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("ruleContent")}
          className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-muted/30 transition-colors"
        >
          <h2 className="text-lg font-semibold text-foreground">Rule Content</h2>
          {expandedSections.ruleContent ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.ruleContent && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 border-t border-border pt-4">
            {/* Rule Description */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Rule Description
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                The actual rule text that will be implemented
              </p>
              <textarea
                {...register("rule_details.rule_description")}
                rows={6}
                placeholder="Enter the complete rule text..."
                className="mt-2 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
              {errors.rule_details?.rule_description && (
                <p className="text-sm text-destructive mt-1">
                  {errors.rule_details.rule_description.message}
                </p>
              )}
            </div>

            {/* Change Summary */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Change Summary
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                What changed in this update
              </p>
              <textarea
                {...register("rule_details.change_summary")}
                rows={4}
                placeholder="Describe what changed in this rule update..."
                className="mt-2 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
              {errors.rule_details?.change_summary && (
                <p className="text-sm text-destructive mt-1">
                  {errors.rule_details.change_summary.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info about test cases */}
      {mode === "create" && (
        <div className="rounded-lg bg-muted/50 border border-border p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Test cases can be added after creating the rule
            update story. Save this form first, then add test cases from the story
            detail page.
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Rule Update" : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
