import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react"

// Force dynamic rendering (no caching) so loading state shows
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch summary statistics
  const [
    { count: totalStories },
    { count: approvedStories },
    { count: pendingStories },
    { count: needsDiscussion },
  ] = await Promise.all([
    supabase.from("user_stories").select("*", { count: "exact", head: true }),
    supabase.from("user_stories").select("*", { count: "exact", head: true }).eq("status", "Approved"),
    supabase.from("user_stories").select("*", { count: "exact", head: true }).eq("status", "Pending Client Review"),
    supabase.from("user_stories").select("*", { count: "exact", head: true }).eq("status", "Needs Discussion"),
  ])

  // Fetch recent stories
  const { data: recentStories } = await supabase
    .from("user_stories")
    .select("story_id, title, status, priority, program_id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5)

  const stats = [
    {
      name: "Total Stories",
      value: totalStories || 0,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      name: "Approved",
      value: approvedStories || 0,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      name: "Pending Review",
      value: pendingStories || 0,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      name: "Needs Discussion",
      value: needsDiscussion || 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of requirements and approval status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-card p-6 shadow-sm border border-border"
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Stories */}
      <div className="rounded-lg bg-card shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Recently Updated Stories
          </h2>
        </div>
        <div className="divide-y divide-border">
          {recentStories && recentStories.length > 0 ? (
            recentStories.map((story) => (
              <Link
                key={story.story_id}
                href={`/stories/${story.story_id}`}
                className="block px-4 sm:px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                {/* Mobile layout: stacked */}
                <div className="sm:hidden space-y-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {story.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{story.story_id}</span>
                    <span>·</span>
                    <span>{story.program_id}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        story.status === "Approved"
                          ? "bg-success/10 text-success"
                          : story.status === "Pending Client Review"
                          ? "bg-warning/10 text-warning"
                          : story.status === "Needs Discussion"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {story.status}
                    </span>
                    {story.priority && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          story.priority === "Must Have"
                            ? "bg-destructive/10 text-destructive"
                            : story.priority === "Should Have"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {story.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop layout: horizontal */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {story.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {story.story_id}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {story.program_id}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {story.priority && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          story.priority === "Must Have"
                            ? "bg-destructive/10 text-destructive"
                            : story.priority === "Should Have"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {story.priority}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        story.status === "Approved"
                          ? "bg-success/10 text-success"
                          : story.status === "Pending Client Review"
                          ? "bg-warning/10 text-warning"
                          : story.status === "Needs Discussion"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {story.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No stories found. Create your first story to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
