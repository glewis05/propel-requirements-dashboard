"use client"

import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  CheckSquare,
  Target,
  AlertCircle,
  Settings,
  Loader2,
  GitBranch,
} from "lucide-react"
import { CollapsibleSection } from "./collapsible-section"
import { RelatedStoriesSelector } from "./related-stories-selector"
import { AIAcceptanceCriteria } from "./ai-acceptance-criteria"
import {
  storyFormSchema,
  StoryFormData,
  STORY_STATUSES,
  STORY_PRIORITIES,
  STORY_CATEGORIES,
} from "@/lib/validations/story"
import type { Database } from "@/types/database"

type Program = Database["public"]["Tables"]["programs"]["Row"]
type UserStory = Database["public"]["Tables"]["user_stories"]["Row"]

interface StoryOption {
  story_id: string
  title: string
  program_id: string
  program_name?: string
  parent_story_id?: string | null
}

interface StoryFormProps {
  mode: "create" | "edit"
  initialData?: Partial<UserStory>
  programs: Program[]
  potentialParents?: StoryOption[]
  allStories?: StoryOption[]
  onSubmit: (data: StoryFormData) => Promise<{ success: boolean; error?: string; storyId?: string }>
  onCancel?: () => void
}

export function StoryForm({
  mode,
  initialData,
  programs,
  potentialParents = [],
  allStories = [],
  onSubmit,
  onCancel,
}: StoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<StoryFormData>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      program_id: initialData?.program_id || "",
      status: initialData?.status || "Draft",
      priority: initialData?.priority as StoryFormData["priority"] || null,
      user_story: initialData?.user_story || "",
      role: initialData?.role || "",
      capability: initialData?.capability || "",
      benefit: initialData?.benefit || "",
      acceptance_criteria: initialData?.acceptance_criteria || "",
      success_metrics: initialData?.success_metrics || "",
      category: initialData?.category || "",
      category_full: initialData?.category_full || "",
      is_technical: initialData?.is_technical || false,
      roadmap_target: initialData?.roadmap_target || "",
      internal_notes: initialData?.internal_notes || "",
      meeting_context: initialData?.meeting_context || "",
      client_feedback: initialData?.client_feedback || "",
      requirement_id: initialData?.requirement_id || null,
      parent_story_id: initialData?.parent_story_id || null,
      related_stories: (initialData?.related_stories as string[]) || [],
    },
  })

  const watchUserStory = watch("user_story")
  const watchRole = watch("role")
  const watchProgramId = watch("program_id")
  const watchParentStoryId = watch("parent_story_id")
  const watchRelatedStories = watch("related_stories") || []

  // Filter potential parents by selected program (same program only, no existing parent)
  const filteredPotentialParents = potentialParents.filter(
    (story) =>
      story.program_id === watchProgramId &&
      story.story_id !== initialData?.story_id // Exclude self
  )

  const handleFormSubmit = async (data: StoryFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await onSubmit(data)
      if (result.success) {
        if (mode === "create" && result.storyId) {
          router.push(`/stories/${result.storyId}`)
        } else if (mode === "edit") {
          router.push(`/stories/${initialData?.story_id}`)
        }
      } else {
        setSubmitError(result.error || "An error occurred")
      }
    } catch {
      setSubmitError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Banner */}
      {submitError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Error saving story</p>
            <p className="text-sm text-destructive/80 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Basic Info Section */}
      <div className="rounded-lg bg-card shadow-sm border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.title ? "border-destructive" : "border-input"
            }`}
            placeholder="Brief description of the requirement"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Program and Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Program */}
          <div>
            <label htmlFor="program_id" className="block text-sm font-medium text-foreground mb-1">
              Program <span className="text-destructive">*</span>
            </label>
            <select
              id="program_id"
              {...register("program_id")}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.program_id ? "border-destructive" : "border-input"
              }`}
            >
              <option value="">Select a program</option>
              {programs.map((program) => (
                <option key={program.program_id} value={program.program_id}>
                  {program.name}
                </option>
              ))}
            </select>
            {errors.program_id && (
              <p className="mt-1 text-sm text-destructive">{errors.program_id.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
              Status <span className="text-destructive">*</span>
            </label>
            <select
              id="status"
              {...register("status")}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.status ? "border-destructive" : "border-input"
              }`}
            >
              {STORY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Priority and Roadmap Target Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-1">
              Priority
            </label>
            <select
              id="priority"
              {...register("priority")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select priority</option>
              {STORY_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          {/* Roadmap Target */}
          <div>
            <label htmlFor="roadmap_target" className="block text-sm font-medium text-foreground mb-1">
              Roadmap Target
            </label>
            <input
              id="roadmap_target"
              type="text"
              {...register("roadmap_target")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g., Q1 2026, Phase 2"
            />
          </div>
        </div>
      </div>

      {/* User Story Section */}
      <CollapsibleSection
        title="User Story"
        icon={<FileText className="h-5 w-5 text-primary" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive">*</span> Required: Use the structured format (recommended) <strong>or</strong> provide a free-text user story below.
          </p>

          {/* Structured User Story - Now First */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1">
                As a... (Role) <span className="text-muted-foreground font-normal">(Recommended)</span>
              </label>
              <input
                id="role"
                type="text"
                {...register("role")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Clinical User"
                disabled={!!watchUserStory}
              />
            </div>
            <div>
              <label htmlFor="capability" className="block text-sm font-medium text-foreground mb-1">
                I want to... (Capability)
              </label>
              <input
                id="capability"
                type="text"
                {...register("capability")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., view patient history"
                disabled={!!watchUserStory}
              />
            </div>
            <div>
              <label htmlFor="benefit" className="block text-sm font-medium text-foreground mb-1">
                So that... (Benefit)
              </label>
              <input
                id="benefit"
                type="text"
                {...register("benefit")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., I can make informed decisions"
                disabled={!!watchUserStory}
              />
            </div>
          </div>

          {/* Note about structured format */}
          {watchRole && !watchUserStory && (
            <p className="text-xs text-success">
              Using the structured format helps with consistent categorization and AI analysis.
            </p>
          )}

          {/* OR divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or use free-text format</span>
            </div>
          </div>

          {/* Full User Story - Now Second */}
          <div>
            <label htmlFor="user_story" className="block text-sm font-medium text-foreground mb-1">
              Free-text User Story
            </label>
            <textarea
              id="user_story"
              rows={3}
              {...register("user_story")}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.user_story ? "border-destructive" : "border-input"
              }`}
              placeholder="As a [role], I want to [capability] so that [benefit]"
              disabled={!!watchRole}
            />
            {errors.user_story && (
              <p className="mt-1 text-sm text-destructive">{errors.user_story.message}</p>
            )}
            {watchUserStory && (
              <p className="mt-1 text-xs text-muted-foreground">
                Note: Using free-text disables the structured fields above.
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Story Relationships Section */}
      {(potentialParents.length > 0 || allStories.length > 0) && (
        <CollapsibleSection
          title="Story Relationships"
          icon={<GitBranch className="h-5 w-5 text-purple-500" />}
          defaultOpen={false}
          badge={
            (watchParentStoryId ? 1 : 0) + (watchRelatedStories?.length || 0) || undefined
          }
        >
          <div className="space-y-4">
            {/* Parent Story */}
            {potentialParents.length > 0 && (
              <div>
                <label htmlFor="parent_story_id" className="block text-sm font-medium text-foreground mb-1">
                  Parent Story
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select a parent story to create a hierarchy. Parent must be in the same program.
                </p>
                <select
                  id="parent_story_id"
                  {...register("parent_story_id")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={!watchProgramId}
                >
                  <option value="">No parent (top-level story)</option>
                  {filteredPotentialParents.map((story) => (
                    <option key={story.story_id} value={story.story_id}>
                      {story.title} ({story.story_id})
                    </option>
                  ))}
                </select>
                {!watchProgramId && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select a program first to see available parent stories.
                  </p>
                )}
              </div>
            )}

            {/* Related Stories */}
            {allStories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Related Stories
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Link to related stories across any program. These connections are bidirectional.
                </p>
                <RelatedStoriesSelector
                  stories={allStories}
                  selectedIds={watchRelatedStories as string[]}
                  onChange={(ids) => setValue("related_stories", ids, { shouldDirty: true })}
                  excludeId={initialData?.story_id}
                  placeholder="Search for stories to link..."
                />
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Acceptance Criteria Section */}
      <CollapsibleSection
        title="Acceptance Criteria"
        icon={<CheckSquare className="h-5 w-5 text-success" />}
        defaultOpen={true}
      >
        <div className="space-y-3">
          {/* AI Acceptance Criteria Generator */}
          <AIAcceptanceCriteria
            storyTitle={watch("title") || ""}
            storyDescription={watch("user_story") || `${watch("role") || ""} ${watch("capability") || ""} ${watch("benefit") || ""}`.trim()}
            userType={watch("role") || undefined}
            programName={programs.find(p => p.program_id === watchProgramId)?.name}
            onAccept={(criteria) => {
              const current = watch("acceptance_criteria") || ""
              const newValue = current ? `${current}\n\n${criteria}` : criteria
              setValue("acceptance_criteria", newValue, { shouldDirty: true })
            }}
          />

          <div>
            <label htmlFor="acceptance_criteria" className="block text-sm font-medium text-foreground mb-1">
              Acceptance Criteria
            </label>
            <textarea
              id="acceptance_criteria"
              rows={6}
              {...register("acceptance_criteria")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Given [precondition]&#10;When [action]&#10;Then [expected result]&#10;&#10;- Criterion 1&#10;- Criterion 2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use Given/When/Then format or bullet points to define acceptance criteria.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Success Metrics Section */}
      <CollapsibleSection
        title="Success Metrics"
        icon={<Target className="h-5 w-5 text-warning" />}
        defaultOpen={false}
      >
        <div>
          <label htmlFor="success_metrics" className="block text-sm font-medium text-foreground mb-1">
            Success Metrics
          </label>
          <textarea
            id="success_metrics"
            rows={3}
            {...register("success_metrics")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="How will success be measured? Include quantifiable metrics where possible."
          />
        </div>
      </CollapsibleSection>

      {/* Classification Section */}
      <CollapsibleSection
        title="Classification"
        icon={<Settings className="h-5 w-5 text-muted-foreground" />}
        defaultOpen={false}
      >
        <div className="space-y-4">
          {/* Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
                Category
              </label>
              <select
                id="category"
                {...register("category")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select category</option>
                {STORY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="category_full" className="block text-sm font-medium text-foreground mb-1">
                Full Category Path
              </label>
              <input
                id="category_full"
                type="text"
                {...register("category_full")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., User Interface > Dashboard > Charts"
              />
            </div>
          </div>

          {/* Technical Flag */}
          <div className="flex items-center gap-2">
            <input
              id="is_technical"
              type="checkbox"
              {...register("is_technical")}
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            <label htmlFor="is_technical" className="text-sm text-foreground">
              This is a technical story (not visible to stakeholders)
            </label>
          </div>
        </div>
      </CollapsibleSection>

      {/* Internal Notes Section */}
      <CollapsibleSection
        title="Internal Notes"
        icon={<AlertCircle className="h-5 w-5 text-warning" />}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="bg-warning/5 border border-warning/20 rounded-md p-3 text-sm text-muted-foreground">
            These notes are only visible to internal team members.
          </div>

          <div>
            <label htmlFor="internal_notes" className="block text-sm font-medium text-foreground mb-1">
              Internal Notes
            </label>
            <textarea
              id="internal_notes"
              rows={3}
              {...register("internal_notes")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Notes, concerns, or context for the development team"
            />
          </div>

          <div>
            <label htmlFor="meeting_context" className="block text-sm font-medium text-foreground mb-1">
              Meeting Context
            </label>
            <textarea
              id="meeting_context"
              rows={2}
              {...register("meeting_context")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Reference to meeting where this was discussed"
            />
          </div>

          <div>
            <label htmlFor="client_feedback" className="block text-sm font-medium text-foreground mb-1">
              Client Feedback
            </label>
            <textarea
              id="client_feedback"
              rows={2}
              {...register("client_feedback")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Direct feedback or quotes from the client"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || (!isDirty && mode === "edit")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Story" : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
