import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Plus } from "lucide-react"
import { StoriesListRealtime } from "@/components/stories/stories-list-realtime"

// Force dynamic rendering (no caching) so loading state shows
export const dynamic = 'force-dynamic'

export default async function StoriesPage() {
  const supabase = await createClient()

  // Fetch stories with program info (exclude soft-deleted)
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
      updated_at,
      story_type
    `)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  // Fetch rule update details for rule_update stories
  const ruleUpdateStoryIds = (stories || [])
    .filter(s => s.story_type === "rule_update")
    .map(s => s.story_id)

  let ruleDetailsMap = new Map<string, { rule_type: string; target_rule: string }>()

  if (ruleUpdateStoryIds.length > 0) {
    const { data: ruleDetails } = await supabase
      .from("rule_update_details")
      .select("story_id, rule_type, target_rule")
      .in("story_id", ruleUpdateStoryIds)

    if (ruleDetails) {
      ruleDetails.forEach(rd => {
        ruleDetailsMap.set(rd.story_id, {
          rule_type: rd.rule_type,
          target_rule: rd.target_rule,
        })
      })
    }
  }

  // Merge rule details into stories
  const storiesWithRuleInfo = (stories || []).map(story => {
    const ruleInfo = ruleDetailsMap.get(story.story_id)
    return {
      ...story,
      rule_type: ruleInfo?.rule_type,
      target_rule: ruleInfo?.target_rule,
    }
  })

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
          <h1 className="text-2xl font-bold text-foreground">Stories</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all user stories and rule updates across programs
          </p>
        </div>
        <Link
          href="/stories/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Story
        </Link>
      </div>

      {/* Stories List with Real-time Updates */}
      <StoriesListRealtime
        initialStories={storiesWithRuleInfo}
        programs={programs || []}
      />
    </div>
  )
}
