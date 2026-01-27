"use client"

import { useState, useCallback } from "react"
import { useCommentsSubscription, Comment } from "@/hooks/use-comments-subscription"
import { CollapsibleSection } from "./collapsible-section"
import { MessageSquare, Loader2, HelpCircle, CheckCircle, AlertCircle } from "lucide-react"
import { createComment } from "@/app/(dashboard)/stories/comment-actions"

interface CommentsSectionProps {
  storyId: string
  initialComments: Comment[]
}

export function CommentsSection({
  storyId,
  initialComments,
}: CommentsSectionProps) {
  const { comments, isConnected, error: subscriptionError } = useCommentsSubscription(
    storyId,
    initialComments
  )

  const [newComment, setNewComment] = useState("")
  const [isQuestion, setIsQuestion] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) {
      setSubmitError("Please enter a comment")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    const result = await createComment(storyId, newComment, isQuestion)

    if (result.success) {
      setNewComment("")
      setIsQuestion(false)
      setSubmitSuccess(true)
      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000)
    } else {
      setSubmitError(result.error || "Failed to add comment")
    }

    setIsSubmitting(false)
  }, [storyId, newComment, isQuestion])

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
      {comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`border-l-2 pl-4 py-2 ${
                comment.is_question
                  ? "border-warning/50 bg-warning/5"
                  : comment.resolved
                  ? "border-success/50 bg-success/5"
                  : "border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {comment.is_question && (
                    <div className="flex items-center gap-1 text-xs text-warning mb-1">
                      <HelpCircle className="h-3 w-3" />
                      Question
                    </div>
                  )}
                  {comment.resolved && (
                    <div className="flex items-center gap-1 text-xs text-success mb-1">
                      <CheckCircle className="h-3 w-3" />
                      Resolved
                    </div>
                  )}
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
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

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border space-y-3">
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
            Comment added successfully
          </div>
        )}

        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          rows={3}
          disabled={isSubmitting}
          maxLength={5000}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Question checkbox */}
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

          {/* Character count and submit button */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {newComment.length}/5000
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Adding..." : "Add Comment"}
            </button>
          </div>
        </div>
      </form>
    </CollapsibleSection>
  )
}
