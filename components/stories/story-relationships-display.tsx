"use client"

import Link from "next/link"
import { GitBranch, ArrowUp, ArrowDown, Link2 } from "lucide-react"
import { CollapsibleSection } from "./collapsible-section"

interface RelatedStory {
  story_id: string
  title: string
  status: string
  program_id: string
  program_name?: string
}

interface StoryRelationshipsDisplayProps {
  parentStory?: RelatedStory | null
  childStories: RelatedStory[]
  relatedStories: RelatedStory[]
  currentProgramId: string
}

export function StoryRelationshipsDisplay({
  parentStory,
  childStories,
  relatedStories,
  currentProgramId,
}: StoryRelationshipsDisplayProps) {
  const totalRelationships =
    (parentStory ? 1 : 0) + childStories.length + relatedStories.length

  // Don't render if no relationships
  if (totalRelationships === 0) {
    return null
  }

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

  const StoryCard = ({ story, showProgram = false }: { story: RelatedStory; showProgram?: boolean }) => (
    <Link
      href={`/stories/${story.story_id}`}
      className="block rounded-md border border-border bg-background p-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate" title={story.title}>
            {story.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span className="font-mono">{story.story_id}</span>
            {showProgram && story.program_name && story.program_id !== currentProgramId && (
              <span className="text-primary">({story.program_name})</span>
            )}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border shrink-0 ${getStatusColor(
            story.status
          )}`}
        >
          {story.status}
        </span>
      </div>
    </Link>
  )

  return (
    <CollapsibleSection
      title="Story Relationships"
      icon={<GitBranch className="h-5 w-5 text-purple-500" />}
      defaultOpen={true}
      badge={totalRelationships}
    >
      <div className="space-y-5">
        {/* Parent Story */}
        {parentStory && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ArrowUp className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Parent Story</h3>
            </div>
            <StoryCard story={parentStory} />
          </div>
        )}

        {/* Child Stories */}
        {childStories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Child Stories ({childStories.length})
              </h3>
            </div>
            <div className="space-y-2">
              {childStories.map((story) => (
                <StoryCard key={story.story_id} story={story} />
              ))}
            </div>
          </div>
        )}

        {/* Related Stories */}
        {relatedStories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Linked Stories ({relatedStories.length})
              </h3>
            </div>
            <div className="space-y-2">
              {relatedStories.map((story) => (
                <StoryCard key={story.story_id} story={story} showProgram />
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
