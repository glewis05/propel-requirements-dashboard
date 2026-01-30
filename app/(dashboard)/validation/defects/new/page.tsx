"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DefectForm } from "@/components/uat/defects/DefectForm"
import { createDefect } from "@/app/(dashboard)/validation/defect-actions"
import type { DefectFormData } from "@/app/(dashboard)/validation/defect-actions"
import { ArrowLeft } from "lucide-react"

export default function NewDefectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stories, setStories] = useState<Array<{ story_id: string; title: string; program_id: string }>>([])
  const [selectedStory, setSelectedStory] = useState<string>("")

  useEffect(() => {
    const fetchStories = async () => {
      const res = await fetch("/api/stories-list")
      if (res.ok) {
        const data = await res.json()
        setStories(data.stories || [])
      }
    }
    fetchStories().catch(() => {})
  }, [])

  const selectedStoryData = stories.find(s => s.story_id === selectedStory)

  const handleSubmit = async (data: DefectFormData) => {
    setIsLoading(true)
    setError(null)

    const result = await createDefect(data)

    if (result.success) {
      router.push("/validation/defects")
    } else {
      setError(result.error || "Failed to create defect")
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/validation/defects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Defects
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Report Defect</h1>
        <p className="text-muted-foreground">
          Report a new defect found during testing
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <label className="block text-sm font-medium mb-1">Select Story *</label>
        <select
          value={selectedStory}
          onChange={(e) => setSelectedStory(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Select a story...</option>
          {stories.map(s => (
            <option key={s.story_id} value={s.story_id}>
              {s.story_id} - {s.title}
            </option>
          ))}
        </select>
      </div>

      {selectedStory && selectedStoryData && (
        <div className="rounded-lg border bg-card p-6">
          <DefectForm
            storyId={selectedStory}
            programId={selectedStoryData.program_id}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/validation/defects")}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  )
}
