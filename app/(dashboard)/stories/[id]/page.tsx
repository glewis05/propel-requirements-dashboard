import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  ArrowLeft,
  Edit,
  Clock,
  MessageSquare,
  FileText,
  CheckSquare,
  AlertCircle,
  Target,
  Layers,
  Calendar,
  User
} from "lucide-react"
import { CollapsibleSection } from "@/components/stories/collapsible-section"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

  // Fetch program name
  const { data: program } = await supabase
    .from("programs")
    .select("name, prefix")
    .eq("program_id", story.program_id)
    .single()

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

  // Helper function for status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-success/10 text-success border-success/20"
      case "Pending Client Review":
        return "bg-warning/10 text-warning border-warning/20"
      case "Needs Discussion":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "Internal Review":
        return "bg-primary/10 text-primary border-primary/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  // Helper function for priority badge colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Must Have":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "Should Have":
        return "bg-warning/10 text-warning border-warning/20"
      case "Could Have":
        return "bg-primary/10 text-primary border-primary/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

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
      <div className="rounded-lg bg-card shadow-sm border border-border p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            {/* ID and Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                {story.story_id}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getStatusColor(
                  story.status
                )}`}
              >
                {story.status}
              </span>
              {story.priority && (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getPriorityColor(
                    story.priority
                  )}`}
                >
                  {story.priority}
                </span>
              )}
              {story.is_technical && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                  Technical
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground">
              {story.title}
            </h1>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {program?.name || story.program_id}
              </span>
              {story.roadmap_target && (
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {story.roadmap_target}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Updated {new Date(story.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <Link
            href={`/stories/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit Story
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* User Story */}
          <CollapsibleSection
            title="User Story"
            icon={<FileText className="h-5 w-5 text-primary" />}
            defaultOpen={true}
          >
            {story.user_story ? (
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {story.user_story}
              </p>
            ) : (
              <p className="text-muted-foreground italic">No user story defined.</p>
            )}

            {/* Show role/capability/benefit if present */}
            {(story.role || story.capability || story.benefit) && (
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
                {story.role && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase">As a</dt>
                    <dd className="text-sm text-foreground mt-1">{story.role}</dd>
                  </div>
                )}
                {story.capability && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase">I want to</dt>
                    <dd className="text-sm text-foreground mt-1">{story.capability}</dd>
                  </div>
                )}
                {story.benefit && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase">So that</dt>
                    <dd className="text-sm text-foreground mt-1">{story.benefit}</dd>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>

          {/* Acceptance Criteria */}
          <CollapsibleSection
            title="Acceptance Criteria"
            icon={<CheckSquare className="h-5 w-5 text-success" />}
            defaultOpen={true}
          >
            {story.acceptance_criteria ? (
              <div className="prose prose-sm max-w-none text-foreground">
                <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/30 p-4 rounded-md">
                  {story.acceptance_criteria}
                </pre>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No acceptance criteria defined.</p>
            )}
          </CollapsibleSection>

          {/* Success Metrics */}
          {story.success_metrics && (
            <CollapsibleSection
              title="Success Metrics"
              icon={<Target className="h-5 w-5 text-warning" />}
              defaultOpen={false}
            >
              <p className="text-foreground whitespace-pre-wrap">
                {story.success_metrics}
              </p>
            </CollapsibleSection>
          )}

          {/* Internal Notes (Admin only view) */}
          {story.internal_notes && (
            <CollapsibleSection
              title="Internal Notes"
              icon={<AlertCircle className="h-5 w-5 text-warning" />}
              defaultOpen={false}
            >
              <div className="bg-warning/5 border border-warning/20 rounded-md p-4">
                <p className="text-foreground whitespace-pre-wrap text-sm">
                  {story.internal_notes}
                </p>
              </div>
            </CollapsibleSection>
          )}

          {/* Meeting Context */}
          {story.meeting_context && (
            <CollapsibleSection
              title="Meeting Context"
              icon={<User className="h-5 w-5 text-muted-foreground" />}
              defaultOpen={false}
            >
              <p className="text-foreground whitespace-pre-wrap text-sm">
                {story.meeting_context}
              </p>
            </CollapsibleSection>
          )}

          {/* Client Feedback */}
          {story.client_feedback && (
            <CollapsibleSection
              title="Client Feedback"
              icon={<MessageSquare className="h-5 w-5 text-primary" />}
              defaultOpen={false}
            >
              <p className="text-foreground whitespace-pre-wrap text-sm">
                {story.client_feedback}
              </p>
            </CollapsibleSection>
          )}

          {/* Comments */}
          <CollapsibleSection
            title="Comments"
            icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
            badge={comments?.length || 0}
            defaultOpen={true}
          >
            {comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-l-2 border-primary/30 pl-4 py-2"
                  >
                    <p className="text-sm text-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
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
          </CollapsibleSection>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details Card */}
          <div className="rounded-lg bg-card shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Details
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Program
                </dt>
                <dd className="text-sm text-foreground mt-1">
                  {program?.name || story.program_id}
                  {program?.prefix && (
                    <span className="text-muted-foreground ml-2">({program.prefix})</span>
                  )}
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
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Created
                </dt>
                <dd className="text-sm text-foreground mt-1">
                  {new Date(story.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  Last Updated
                </dt>
                <dd className="text-sm text-foreground mt-1">
                  {new Date(story.updated_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Approval Info */}
          {(story.approved_at || story.stakeholder_approved_at) && (
            <div className="rounded-lg bg-success/5 border border-success/20 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Approval Info
              </h2>
              <dl className="space-y-3">
                {story.approved_at && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase">
                      Approved At
                    </dt>
                    <dd className="text-sm text-foreground mt-1">
                      {new Date(story.approved_at).toLocaleString()}
                    </dd>
                  </div>
                )}
                {story.stakeholder_approved_at && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase">
                      Stakeholder Approved
                    </dt>
                    <dd className="text-sm text-foreground mt-1">
                      {new Date(story.stakeholder_approved_at).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

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
                    className="text-sm border-l-2 border-muted pl-3 py-1"
                  >
                    <p className="font-medium text-foreground">
                      v{version.version_number}
                    </p>
                    {version.change_summary && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {version.change_summary}
                      </p>
                    )}
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
