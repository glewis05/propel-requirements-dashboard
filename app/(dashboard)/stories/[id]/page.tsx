import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, Edit, Clock, User, MessageSquare } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function StoryDetailPage({ params }: Props) {
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

  // Fetch comments
  const { data: comments } = await supabase
    .from("story_comments")
    .select("*")
    .eq("story_id", id)
    .order("created_at", { ascending: true })

  // Fetch version history
  const { data: versions } = await supabase
    .from("story_versions")
    .select("*")
    .eq("story_id", id)
    .order("version_number", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/stories"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Stories
      </Link>

      {/* Story Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-foreground">
              {story.story_id}
            </span>
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
          <h1 className="text-2xl font-bold text-foreground mt-2">
            {story.title}
          </h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Edit className="h-4 w-4" />
          Edit Story
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Story */}
          {story.user_story && (
            <div className="rounded-lg bg-card shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                User Story
              </h2>
              <p className="text-foreground whitespace-pre-wrap">
                {story.user_story}
              </p>
            </div>
          )}

          {/* Acceptance Criteria */}
          {story.acceptance_criteria && (
            <div className="rounded-lg bg-card shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Acceptance Criteria
              </h2>
              <div className="prose prose-sm max-w-none text-foreground">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {story.acceptance_criteria}
                </pre>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-lg bg-card shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments
              {comments && comments.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({comments.length})
                </span>
              )}
            </h2>
            {comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-l-2 border-primary/30 pl-4"
                  >
                    <p className="text-sm text-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No comments yet. Be the first to add one.
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-border">
              <textarea
                placeholder="Add a comment..."
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={3}
              />
              <button className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Add Comment
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="rounded-lg bg-card shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Details
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Program
                </dt>
                <dd className="text-sm text-foreground mt-1">
                  {story.program_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Category
                </dt>
                <dd className="text-sm text-foreground mt-1">
                  {story.category_full || story.category || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Roadmap Target
                </dt>
                <dd className="text-sm text-foreground mt-1">
                  {story.roadmap_target || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Version
                </dt>
                <dd className="text-sm text-foreground mt-1">
                  v{story.version}
                </dd>
              </div>
            </dl>
          </div>

          {/* Version History */}
          <div className="rounded-lg bg-card shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Version History
            </h2>
            {versions && versions.length > 0 ? (
              <ul className="space-y-3">
                {versions.map((version) => (
                  <li
                    key={version.id}
                    className="text-sm border-l-2 border-muted pl-3"
                  >
                    <p className="font-medium text-foreground">
                      v{version.version_number}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {version.change_summary}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      {new Date(version.changed_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No version history available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
