import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  ArrowLeft,
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
import { CommentsSection } from "@/components/stories/comments-section"
import { StoryActions } from "@/components/stories/story-actions"
import { VersionHistory } from "@/components/stories/version-history"
import { StoryRelationshipsDisplay } from "@/components/stories/story-relationships-display"
import { StatusTransitionWrapper } from "@/components/stories/status-transition-wrapper"
import { ApprovalHistoryTimeline } from "@/components/stories/approval-history-timeline"
import type { StoryStatus, UserRole, ApprovalType, ApprovalStatus } from "@/types/database"

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

  // Fetch version history (all versions for diff comparison)
  const { data: versions } = await supabase
    .from("story_versions")
    .select("*")
    .eq("story_id", id)
    .order("version_number", { ascending: false })

  // Fetch approval history
  const { data: approvals } = await supabase
    .from("story_approvals")
    .select("*")
    .eq("story_id", id)
    .order("approved_at", { ascending: false })

  // Fetch user names for approvals, versions, and comments
  const userIds = new Set<string>()
  approvals?.forEach(a => userIds.add(a.approved_by))
  versions?.forEach(v => userIds.add(v.changed_by))
  comments?.forEach(c => userIds.add(c.user_id))

  const { data: userNames } = await supabase
    .from("users")
    .select("user_id, auth_id, name")
    .or(`user_id.in.(${Array.from(userIds).join(',')}),auth_id.in.(${Array.from(userIds).join(',')})`)

  const userNameMap = new Map<string, string>()
  userNames?.forEach(u => {
    userNameMap.set(u.user_id, u.name)
    if (u.auth_id) userNameMap.set(u.auth_id, u.name)
  })

  // Add names to approvals and versions
  const approvalsWithNames = (approvals || []).map(a => ({
    ...a,
    approval_type: a.approval_type as ApprovalType,
    status: a.status as ApprovalStatus,
    approver_name: userNameMap.get(a.approved_by) || "Unknown",
  }))

  const versionsWithNames = (versions || []).map(v => ({
    ...v,
    changer_name: userNameMap.get(v.changed_by) || "Unknown",
  }))

  const commentsWithNames = (comments || []).map(c => ({
    ...c,
    user_name: userNameMap.get(c.user_id) || "Unknown",
  }))

  // Get current user role for permissions
  const { data: { user } } = await supabase.auth.getUser()
  let canDelete = false
  let userRole: UserRole | null = null
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single()
    userRole = userData?.role as UserRole | null
    canDelete = userRole === "Admin"
  }

  // Fetch parent story if exists
  let parentStory = null
  if (story.parent_story_id) {
    const { data: parentData } = await supabase
      .from("user_stories")
      .select("story_id, title, status, program_id")
      .eq("story_id", story.parent_story_id)
      .single()

    if (parentData) {
      parentStory = {
        ...parentData,
        program_name: program?.name || undefined,
      }
    }
  }

  // Fetch child stories (stories that have this story as parent)
  const { data: childrenData } = await supabase
    .from("user_stories")
    .select("story_id, title, status, program_id")
    .eq("parent_story_id", id)
    .order("title")

  const childStories = (childrenData || []).map(s => ({
    ...s,
    program_name: program?.name || undefined,
  }))

  // Fetch related stories (from this story's related_stories array)
  const relatedStoryIds = (story.related_stories as string[]) || []
  let outgoingRelated: Array<{ story_id: string; title: string; status: string; program_id: string; program_name?: string }> = []

  if (relatedStoryIds.length > 0) {
    const { data: outgoingData } = await supabase
      .from("user_stories")
      .select("story_id, title, status, program_id")
      .in("story_id", relatedStoryIds)

    // Fetch program names for related stories
    const programIds = Array.from(new Set((outgoingData || []).map((s: { program_id: string }) => s.program_id)))
    const { data: programsData } = await supabase
      .from("programs")
      .select("program_id, name")
      .in("program_id", programIds)

    const programNameMap = new Map((programsData || []).map(p => [p.program_id, p.name]))

    outgoingRelated = (outgoingData || []).map(s => ({
      ...s,
      program_name: programNameMap.get(s.program_id) || undefined,
    }))
  }

  // Fetch stories that link TO this story (bidirectional relationship)
  const { data: incomingData } = await supabase.rpc("get_stories_linking_to", {
    p_story_id: id,
  })

  let incomingRelated: Array<{ story_id: string; title: string; status: string; program_id: string; program_name?: string }> = []
  if (incomingData && incomingData.length > 0) {
    // Fetch program names for incoming related stories
    const incomingProgramIds = Array.from(new Set(incomingData.map((s: { program_id: string }) => s.program_id)))
    const { data: incomingProgramsData } = await supabase
      .from("programs")
      .select("program_id, name")
      .in("program_id", incomingProgramIds)

    const incomingProgramMap = new Map((incomingProgramsData || []).map(p => [p.program_id, p.name]))

    incomingRelated = incomingData.map((s: { story_id: string; title: string; status: string; program_id: string }) => ({
      ...s,
      program_name: incomingProgramMap.get(s.program_id) || undefined,
    }))
  }

  // Merge and dedupe related stories (bidirectional)
  const relatedStoriesMap = new Map<string, { story_id: string; title: string; status: string; program_id: string; program_name?: string }>()
  for (const s of outgoingRelated) {
    relatedStoriesMap.set(s.story_id, s)
  }
  for (const s of incomingRelated) {
    if (!relatedStoriesMap.has(s.story_id)) {
      relatedStoriesMap.set(s.story_id, s)
    }
  }
  const relatedStories = Array.from(relatedStoriesMap.values())

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
      <div className="rounded-lg bg-card shadow-sm border border-border p-4 sm:p-6">
        <div className="space-y-4">
          {/* Top row: ID, Badges, and Edit button */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* ID and Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                {story.story_id}
              </span>
              <StatusTransitionWrapper
                storyId={story.story_id}
                currentStatus={story.status as StoryStatus}
                userRole={userRole}
              />
              {story.priority && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getPriorityColor(
                    story.priority
                  )}`}
                >
                  {story.priority}
                </span>
              )}
              {story.is_technical && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                  Technical
                </span>
              )}
            </div>

            {/* Story Actions - Edit and Delete */}
            <StoryActions
              storyId={id}
              storyTitle={story.title}
              canDelete={canDelete}
            />
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {story.title}
          </h1>

          {/* Meta info - stacks on mobile */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
              <span className="hidden sm:inline">Updated </span>
              {new Date(story.updated_at).toLocaleDateString()}
            </span>
          </div>
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

          {/* Story Relationships */}
          <StoryRelationshipsDisplay
            parentStory={parentStory}
            childStories={childStories}
            relatedStories={relatedStories}
            currentProgramId={story.program_id}
          />

          {/* Comments with Real-time Updates */}
          <CommentsSection
            storyId={id}
            initialComments={commentsWithNames}
          />
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

          {/* Version History with Diff Viewer */}
          <VersionHistory
            versions={versions || []}
            currentVersion={story.version}
          />

          {/* Approval History Timeline */}
          <ApprovalHistoryTimeline
            approvals={approvalsWithNames}
            versions={versionsWithNames}
            storyCreatedAt={story.created_at}
            creatorName={versionsWithNames.find(v => v.version_number === 1)?.changer_name}
          />
        </div>
      </div>
    </div>
  )
}
