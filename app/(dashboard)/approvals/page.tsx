import { createClient } from "@/lib/supabase/server"
import { CheckCircle, XCircle, MessageSquare } from "lucide-react"

export default async function ApprovalsPage() {
  const supabase = await createClient()

  // Fetch stories pending approval
  const { data: pendingStories } = await supabase
    .from("user_stories")
    .select(`
      story_id,
      title,
      user_story,
      status,
      priority,
      program_id,
      client_review_date
    `)
    .in("status", ["Internal Review", "Pending Client Review"])
    .order("client_review_date", { ascending: true })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approval Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve pending user stories
        </p>
      </div>

      {/* Pending Approvals */}
      <div className="space-y-4">
        {pendingStories && pendingStories.length > 0 ? (
          pendingStories.map((story) => (
            <div
              key={story.story_id}
              className="rounded-lg bg-card shadow-sm border border-border p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">
                      {story.story_id}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        story.status === "Pending Client Review"
                          ? "bg-warning/10 text-warning"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {story.status}
                    </span>
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
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mt-2">
                    {story.title}
                  </h3>
                  {story.user_story && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {story.user_story}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Program: {story.program_id}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                <button className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors">
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
                <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <MessageSquare className="h-4 w-4" />
                  Request Discussion
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg bg-card shadow-sm border border-border p-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-success/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              All caught up!
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              There are no stories pending your approval.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
