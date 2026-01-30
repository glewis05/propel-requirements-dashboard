"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TestCaseForm } from "@/components/uat/test-cases/TestCaseForm"
import { createTestCase } from "@/app/(dashboard)/uat/actions"
import type { TestCaseFormData } from "@/app/(dashboard)/uat/actions"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewTestCasePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stories, setStories] = useState<Array<{ story_id: string; title: string; program_id: string }>>([])
  const [selectedStory, setSelectedStory] = useState<string>("")

  useEffect(() => {
    // Fetch stories for selection
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

  const handleSubmit = async (data: TestCaseFormData) => {
    setIsLoading(true)
    setError(null)

    const result = await createTestCase(data)

    if (result.success) {
      router.push("/validation/test-cases")
    } else {
      setError(result.error || "Failed to create test case")
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/validation/test-cases"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Test Cases
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">New Test Case</h1>
        <p className="text-muted-foreground">
          Create a new manual test case
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
          <TestCaseForm
            storyId={selectedStory}
            programId={selectedStoryData.program_id}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/validation/test-cases")}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  )
}
