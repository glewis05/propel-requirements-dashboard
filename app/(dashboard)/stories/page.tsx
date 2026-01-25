import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Plus, Search, Filter } from "lucide-react"

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
    .select("program_id, program_name")
    .order("program_name")

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stories..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Programs</option>
            {programs?.map((program) => (
              <option key={program.program_id} value={program.program_id}>
                {program.program_name}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Internal Review">Internal Review</option>
            <option value="Pending Client Review">Pending Client Review</option>
            <option value="Approved">Approved</option>
            <option value="Needs Discussion">Needs Discussion</option>
          </select>
          <select className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Priorities</option>
            <option value="Must Have">Must Have</option>
            <option value="Should Have">Should Have</option>
            <option value="Could Have">Could Have</option>
            <option value="Won't Have">Won&apos;t Have</option>
          </select>
        </div>
      </div>

      {/* Stories Table */}
      <div className="rounded-lg bg-card shadow-sm border border-border overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Story
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Roadmap
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {stories && stories.length > 0 ? (
              stories.map((story) => (
                <tr
                  key={story.story_id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/stories/${story.story_id}`}
                      className="block"
                    >
                      <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                        {story.title}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        {story.story_id}
                      </p>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">
                      {story.program_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {story.priority && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          story.priority === "Must Have"
                            ? "bg-destructive/10 text-destructive"
                            : story.priority === "Should Have"
                            ? "bg-warning/10 text-warning"
                            : story.priority === "Could Have"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {story.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        story.status === "Approved"
                          ? "bg-success/10 text-success"
                          : story.status === "Pending Client Review"
                          ? "bg-warning/10 text-warning"
                          : story.status === "Needs Discussion"
                          ? "bg-destructive/10 text-destructive"
                          : story.status === "Internal Review"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {story.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {story.roadmap_target || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(story.updated_at).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No stories found. Create your first story to get started.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
