import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Plus } from "lucide-react"
import { StoriesList } from "@/components/stories/stories-list"

// Force dynamic rendering (no caching) so loading state shows
export const dynamic = 'force-dynamic'

export default async function StoriesPage() {
  const supabase = await createClient()

  // Fetch stories with program info
  const { data: stories, error } = await supabase
    .from("user_stories")
    .select(`
      story_id,
      title,
      user_story,
      status,
      priority,
      category,
      program_id,
      roadmap_target,
      updated_at
    `)
    .order("updated_at", { ascending: false })

  // Fetch programs for filter
  const { data: programs } = await supabase
    .from("programs")
    .select("program_id, name")
    .order("name")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Stories</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all user stories across programs
          </p>
        </div>
        <Link
          href="/stories/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Story
        </Link>
      </div>

      {/* Stories List with Filtering */}
      <StoriesList
        stories={stories || []}
        programs={programs || []}
      />
    </div>
  )
}
