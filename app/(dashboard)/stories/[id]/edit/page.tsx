import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { StoryFormWrapper } from "./story-form-wrapper"

// Force dynamic rendering
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditStoryPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch story details
  const { data: story, error } = await supabase
    .from("user_stories")
    .select("*")
    .eq("story_id", id)
    .single()

  if (error || !story) {
    notFound()
  }

  // Fetch programs for dropdown
  const { data: programs } = await supabase
    .from("programs")
    .select("*")
    .eq("status", "Active")
    .order("name")

  // Fetch all stories for relationships (excluding current story)
  const { data: allStoriesData } = await supabase
    .from("user_stories")
    .select("story_id, title, program_id, parent_story_id")
    .neq("story_id", id)
    .order("title")

  // Get program names for display
  const programMap = new Map((programs || []).map(p => [p.program_id, p.name]))

  const allStories = (allStoriesData || []).map(s => ({
    story_id: s.story_id,
    title: s.title,
    program_id: s.program_id,
    parent_story_id: s.parent_story_id,
    program_name: programMap.get(s.program_id) || undefined,
  }))

  // Check if this story has children (can't set parent if it does)
  const { data: childrenData } = await supabase
    .from("user_stories")
    .select("story_id")
    .eq("parent_story_id", id)
    .limit(1)

  const hasChildren = (childrenData || []).length > 0

  // Potential parents: same program, no existing parent, and exclude stories that have THIS story as their parent
  // Also, if this story already has children, it can't have a parent
  const potentialParents = hasChildren
    ? [] // Story has children, so it cannot have a parent
    : allStories.filter(s =>
        s.program_id === story.program_id && !s.parent_story_id
      )

  // Check if story is locked by someone else
  const { data: lockData } = await supabase.rpc("is_story_locked", {
    p_story_id: id,
  })

  const lockInfo = lockData && lockData.length > 0 ? lockData[0] : null
  const isLockedByOther = lockInfo?.is_locked === true

  // If locked by someone else, show lock warning
  if (isLockedByOther) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href={`/stories/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Story
        </Link>

        {/* Lock Warning */}
        <div className="rounded-lg bg-warning/10 border border-warning/20 p-6 flex flex-col items-center text-center">
          <Lock className="h-12 w-12 text-warning mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Story is Currently Locked</h1>
          <p className="text-muted-foreground mb-4">
            This story is being edited by <strong>{lockInfo?.locked_by_name || "another user"}</strong>.
          </p>
          {lockInfo?.locked_since && (
            <p className="text-sm text-muted-foreground mb-4">
              Locked since: {new Date(lockInfo.locked_since).toLocaleString()}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Please wait for them to finish or contact them directly.
          </p>
          <Link
            href={`/stories/${id}`}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Story (Read Only)
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href={`/stories/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Story
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Story</h1>
        <p className="text-muted-foreground mt-1">
          <span className="font-mono text-sm">{story.story_id}</span> - {story.title}
        </p>
      </div>

      {/* Story Form with Lock Management */}
      <StoryFormWrapper
        storyId={id}
        initialData={story}
        programs={programs || []}
        potentialParents={potentialParents}
        allStories={allStories}
      />
    </div>
  )
}
