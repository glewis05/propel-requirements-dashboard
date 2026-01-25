"use client"

import { useCommentsSubscription, Comment } from "@/hooks/use-comments-subscription"
import { CollapsibleSection } from "./collapsible-section"
import { MessageSquare } from "lucide-react"

interface CommentsSectionProps {
  storyId: string
  initialComments: Comment[]
}

export function CommentsSection({
  storyId,
  initialComments,
}: CommentsSectionProps) {
  const { comments, isConnected } = useCommentsSubscription(
    storyId,
    initialComments
  )

  return (
    <CollapsibleSection
      title="Comments"
      icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
      badge={comments.length}
      defaultOpen={true}
    >
      {/* Live indicator for comments */}
      {isConnected && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          Live updates enabled
        </div>
      )}

      {/* Comments list */}
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

      {/* Add comment form (placeholder - functionality to be added later) */}
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
  )
}
