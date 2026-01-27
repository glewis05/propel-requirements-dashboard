"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Edit, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { deleteStory } from "@/app/(dashboard)/stories/actions"

interface StoryActionsProps {
  storyId: string
  storyTitle: string
  canDelete: boolean
}

export function StoryActions({ storyId, storyTitle, canDelete }: StoryActionsProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    const result = await deleteStory(storyId)

    if (result.success) {
      setIsDeleteDialogOpen(false)
      router.push("/stories")
    } else {
      setDeleteError(result.error || "Failed to delete story")
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Edit button */}
        <Link
          href={`/stories/${storyId}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span className="hidden sm:inline">Edit Story</span>
          <span className="sm:hidden">Edit</span>
        </Link>

        {/* Delete button - only shown if user can delete */}
        {canDelete && (
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeleteError(null)
        }}
        onConfirm={handleDelete}
        title="Delete Story"
        description={
          deleteError
            ? deleteError
            : `Are you sure you want to delete "${storyTitle}"? This action cannot be undone and will remove all comments, approvals, and version history.`
        }
        confirmText="Delete Story"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}
