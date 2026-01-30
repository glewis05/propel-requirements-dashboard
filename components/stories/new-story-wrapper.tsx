"use client"

import { useState } from "react"
import { StoryTypeSelector } from "./story-type-selector"
import { StoryForm } from "./story-form"
import { RuleUpdateForm } from "./rule-update-form"
import type { StoryType } from "@/lib/rule-update/constants"
import type { StoryFormData } from "@/lib/validations/story"
import type { RuleUpdateStoryFormData } from "@/lib/validations/rule-update"

interface Program {
  program_id: string
  name: string
}

interface StoryReference {
  story_id: string
  title: string
  program_id: string
  parent_story_id: string | null
  program_name?: string
}

interface NewStoryWrapperProps {
  programs: Program[]
  potentialParents: StoryReference[]
  allStories: StoryReference[]
  onCreateUserStory: (data: StoryFormData) => Promise<{ success: boolean; error?: string; storyId?: string }>
  onCreateRuleUpdate: (data: RuleUpdateStoryFormData) => Promise<{ success: boolean; error?: string; storyId?: string }>
}

export function NewStoryWrapper({
  programs,
  potentialParents,
  allStories,
  onCreateUserStory,
  onCreateRuleUpdate,
}: NewStoryWrapperProps) {
  const [storyType, setStoryType] = useState<StoryType>("user_story")
  const [hasSelected, setHasSelected] = useState(false)

  const handleTypeChange = (type: StoryType) => {
    setStoryType(type)
  }

  const handleContinue = () => {
    setHasSelected(true)
  }

  const handleBack = () => {
    setHasSelected(false)
  }

  // Show type selector if not yet selected
  if (!hasSelected) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-card shadow-sm border border-border p-6">
          <StoryTypeSelector value={storyType} onChange={handleTypeChange} />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            className="px-6 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Show the appropriate form based on selection
  if (storyType === "rule_update") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Change story type
        </button>
        <RuleUpdateForm
          mode="create"
          programs={programs}
          onSubmit={onCreateRuleUpdate}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleBack}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Change story type
      </button>
      <StoryForm
        mode="create"
        programs={programs}
        potentialParents={potentialParents}
        allStories={allStories}
        onSubmit={onCreateUserStory}
      />
    </div>
  )
}
