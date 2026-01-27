"use client"

import { useState, useCallback, useMemo } from "react"
import { useCommentsSubscription, Comment } from "@/hooks/use-comments-subscription"
import { CollapsibleSection } from "./collapsible-section"
import {
  MessageSquare,
  Loader2,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Reply,
  X,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react"
import { createComment, resolveComment } from "@/app/(dashboard)/stories/comment-actions"

interface CommentsSectionProps {
  storyId: string
  initialComments: Comment[]
}

interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[]
  user_name?: string
}

export function CommentsSection({
  storyId,
  initialComments,
}: CommentsSectionProps) {
  const { comments, isConnected, error: subscriptionError } = useCommentsSubscription(
    storyId,
    initialComments
  )

  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set())

  // Organize comments into a tree structure
  const threadedComments = useMemo(() => {
    const commentMap = new Map<string, CommentWithReplies>()
    const rootComments: CommentWithReplies[] = []

    // First pass: create all comment objects with empty replies
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize into tree
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
        commentMap.get(comment.parent_comment_id)!.replies.push(commentWithReplies)
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    // Sort replies by date (oldest first)
    const sortReplies = (comments: CommentWithReplies[]) => {
      comments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      comments.forEach((c) => sortReplies(c.replies))
    }
    sortReplies(rootComments)

    return rootComments
  }, [comments])

  const toggleThread = (commentId: string) => {
    setCollapsedThreads((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  const handleResolve = async (commentId: string, resolved: boolean) => {
    await resolveComment(commentId, resolved)
  }

  return (
    <CollapsibleSection
      title="Comments"
      icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
      badge={comments.length}
      defaultOpen={true}
    >
      {/* Live indicator and subscription error */}
      <div className="flex items-center gap-4 mb-4">
        {isConnected && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            Live updates enabled
          </div>
        )}
        {subscriptionError && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            Live updates unavailable
          </div>
        )}
      </div>

      {/* Comments list */}
      {threadedComments.length > 0 ? (
        <div className="space-y-4">
          {threadedComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              storyId={storyId}
              depth={0}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              collapsedThreads={collapsedThreads}
              toggleThread={toggleThread}
              onResolve={handleResolve}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No comments yet. Be the first to add one.
        </p>
      )}

      {/* Add top-level comment form */}
      <CommentForm
        storyId={storyId}
        onSuccess={() => setReplyingTo(null)}
        className="mt-4 pt-4 border-t border-border"
      />
    </CollapsibleSection>
  )
}

interface CommentThreadProps {
  comment: CommentWithReplies
  storyId: string
  depth: number
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
  collapsedThreads: Set<string>
  toggleThread: (id: string) => void
  onResolve: (id: string, resolved: boolean) => void
}

function CommentThread({
  comment,
  storyId,
  depth,
  replyingTo,
  setReplyingTo,
  collapsedThreads,
  toggleThread,
  onResolve,
}: CommentThreadProps) {
  const isCollapsed = collapsedThreads.has(comment.id)
  const hasReplies = comment.replies.length > 0
  const maxDepth = 3 // Limit nesting depth for readability

  return (
    <div className={depth > 0 ? "ml-4 sm:ml-6 border-l-2 border-border pl-4" : ""}>
      <div
        className={`py-3 ${
          comment.is_question
            ? "bg-warning/5 border-l-2 border-warning/50 pl-3 -ml-3"
            : comment.resolved
            ? "bg-success/5 border-l-2 border-success/50 pl-3 -ml-3"
            : ""
        }`}
      >
        {/* Comment header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
              <User className="h-3 w-3" />
            </div>
            <span className="font-medium text-foreground">
              {comment.user_name || "User"}
            </span>
            <span>·</span>
            <span>{formatRelativeTime(comment.created_at)}</span>
          </div>

          <div className="flex items-center gap-1">
            {comment.is_question && !comment.resolved && (
              <button
                onClick={() => onResolve(comment.id, true)}
                className="text-xs text-muted-foreground hover:text-success transition-colors px-2 py-1 rounded hover:bg-success/10"
                title="Mark as resolved"
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </button>
            )}
            {hasReplies && (
              <button
                onClick={() => toggleThread(comment.id)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted flex items-center gap-1"
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>{comment.replies.length}</span>
                  </>
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Question/Resolved badges */}
        <div className="flex items-center gap-2 mt-1">
          {comment.is_question && (
            <span className="inline-flex items-center gap-1 text-xs text-warning">
              <HelpCircle className="h-3 w-3" />
              Question
            </span>
          )}
          {comment.resolved && (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle className="h-3 w-3" />
              Resolved
            </span>
          )}
        </div>

        {/* Comment content */}
        <p className="text-sm text-foreground whitespace-pre-wrap mt-2">
          {comment.content}
        </p>

        {/* Reply button */}
        {depth < maxDepth && (
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>
        )}

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-3">
            <CommentForm
              storyId={storyId}
              parentCommentId={comment.id}
              onSuccess={() => setReplyingTo(null)}
              onCancel={() => setReplyingTo(null)}
              placeholder="Write a reply..."
              compact
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {hasReplies && !isCollapsed && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              storyId={storyId}
              depth={depth + 1}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              collapsedThreads={collapsedThreads}
              toggleThread={toggleThread}
              onResolve={onResolve}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentFormProps {
  storyId: string
  parentCommentId?: string
  onSuccess?: () => void
  onCancel?: () => void
  placeholder?: string
  compact?: boolean
  className?: string
}

function CommentForm({
  storyId,
  parentCommentId,
  onSuccess,
  onCancel,
  placeholder = "Add a comment...",
  compact = false,
  className = "",
}: CommentFormProps) {
  const [newComment, setNewComment] = useState("")
  const [isQuestion, setIsQuestion] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!newComment.trim()) {
        setSubmitError("Please enter a comment")
        return
      }

      setIsSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(false)

      const result = await createComment(storyId, newComment, isQuestion, parentCommentId)

      if (result.success) {
        setNewComment("")
        setIsQuestion(false)
        setSubmitSuccess(true)
        onSuccess?.()
        setTimeout(() => setSubmitSuccess(false), 3000)
      } else {
        setSubmitError(result.error || "Failed to add comment")
      }

      setIsSubmitting(false)
    },
    [storyId, newComment, isQuestion, parentCommentId, onSuccess]
  )

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      {/* Error message */}
      {submitError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {submitError}
        </div>
      )}

      {/* Success message */}
      {submitSuccess && (
        <div className="flex items-center gap-2 text-sm text-success bg-success/10 px-3 py-2 rounded-md">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {parentCommentId ? "Reply added" : "Comment added"}
        </div>
      )}

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
        rows={compact ? 2 : 3}
        disabled={isSubmitting}
        maxLength={5000}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Question checkbox (only for top-level comments) */}
        {!parentCommentId && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isQuestion}
              onChange={(e) => setIsQuestion(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            <HelpCircle className="h-4 w-4" />
            Mark as question
          </label>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {parentCommentId && (
            <span className="text-xs text-muted-foreground mr-2">
              {newComment.length}/5000
            </span>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSubmitting ? "Posting..." : parentCommentId ? "Reply" : "Comment"}
          </button>
        </div>
      </div>

      {!parentCommentId && (
        <div className="text-right">
          <span className="text-xs text-muted-foreground">{newComment.length}/5000</span>
        </div>
      )}
    </form>
  )
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}
