import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { NewStoryWrapper } from "@/components/stories/new-story-wrapper"
import { createStory } from "../actions"
import { createRuleUpdateStory } from "../rule-update-actions"
import type { StoryFormData } from "@/lib/validations/story"
import type { RuleUpdateStoryFormData } from "@/lib/validations/rule-update"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default async function NewStoryPage() {
  const supabase = await createClient()

  // Fetch programs for dropdown
  const { data: programs, error } = await supabase
    .from("programs")
    .select("*")
    .eq("status", "Active")
    .order("name")

  if (error) {
    console.error("Error fetching programs:", error)
  }

  // Fetch all stories for relationships (exclude soft-deleted)
  const { data: allStoriesData } = await supabase
    .from("user_stories")
    .select("story_id, title, program_id, parent_story_id")
    .is("deleted_at", null)
    .order("title")

  // Get program names for display
  const programMap = new Map((programs || []).map(p => [p.program_id, p.name]))

  const allStories = (allStoriesData || []).map(story => ({
    story_id: story.story_id,
    title: story.title,
    program_id: story.program_id,
    parent_story_id: story.parent_story_id,
    program_name: programMap.get(story.program_id) || undefined,
  }))

  // Potential parents: stories that don't already have a parent (to enforce one level)
  const potentialParents = allStories.filter(story => !story.parent_story_id)

  async function handleCreateUserStory(data: StoryFormData) {
    "use server"
    return createStory(data)
  }

  async function handleCreateRuleUpdate(data: RuleUpdateStoryFormData) {
    "use server"
    return createRuleUpdateStory(data)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/stories"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Stories
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create New Story</h1>
        <p className="text-muted-foreground mt-1">
          Add a new user story or rule update to track requirements
        </p>
      </div>

      {/* Story Form Wrapper with Type Selection */}
      <NewStoryWrapper
        programs={programs || []}
        potentialParents={potentialParents}
        allStories={allStories}
        onCreateUserStory={handleCreateUserStory}
        onCreateRuleUpdate={handleCreateRuleUpdate}
      />
    </div>
  )
}
