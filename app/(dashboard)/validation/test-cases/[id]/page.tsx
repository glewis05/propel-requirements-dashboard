import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { TestStepEditor } from "@/components/uat/test-cases/TestStepEditor"
import { AITestCaseGenerator } from "@/components/uat/test-cases/AITestCaseGenerator"
import { cn } from "@/lib/utils"
import { TEST_CASE_STATUS_CONFIG } from "@/lib/uat/execution-transitions"
import type { TestCaseStatus, TestStep } from "@/types/database"
import { ArrowLeft, Sparkles, CheckCircle, Clock, FileText, Edit } from "lucide-react"
import { TestCaseActions } from "./test-case-actions"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TestCaseDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) redirect("/login")

  interface TestCaseRow {
    test_case_id: string
    story_id: string
    program_id: string
    title: string
    description: string | null
    preconditions: string | null
    test_data: string | null
    test_steps: TestStep[]
    expected_results: string | null
    test_type: string
    priority: string
    is_ai_generated: boolean
    ai_model_used: string | null
    human_reviewed: boolean
    reviewed_by: string | null
    reviewed_at: string | null
    status: TestCaseStatus
    version: number
    created_at: string
    updated_at: string
    created_by: string
    is_archived: boolean
  }

  const { data: testCase, error } = await supabase
    .from("test_cases")
    .select("*")
    .eq("test_case_id", id)
    .single() as { data: TestCaseRow | null; error: Error | null }

  if (error || !testCase) {
    notFound()
  }

  // Fetch story title
  const { data: story } = await supabase
    .from("user_stories")
    .select("title")
    .eq("story_id", testCase.story_id)
    .single()

  // Fetch creator name
  const { data: creator } = await supabase
    .from("users")
    .select("name")
    .eq("user_id", testCase.created_by)
    .single()

  // Fetch reviewer name if reviewed
  let reviewerName: string | null = null
  if (testCase.reviewed_by) {
    const { data: reviewer } = await supabase
      .from("users")
      .select("name")
      .eq("user_id", testCase.reviewed_by)
      .single()
    reviewerName = reviewer?.name || null
  }

  const statusConfig = TEST_CASE_STATUS_CONFIG[testCase.status]
  const canEdit = ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(userData.role || "")
  const steps: TestStep[] = Array.isArray(testCase.test_steps) ? testCase.test_steps : []

  const priorityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
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

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{testCase.title}</h1>
          <p className="text-muted-foreground">
            Story: <Link href={`/stories/${testCase.story_id}`} className="text-primary hover:underline">
              {testCase.story_id} - {story?.title || "Unknown"}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border", statusConfig.color)}>
            {statusConfig.label}
          </span>
          <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", priorityColors[testCase.priority])}>
            {testCase.priority}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {testCase.description && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testCase.description}</p>
            </div>
          )}

          {testCase.preconditions && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-2">Preconditions</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testCase.preconditions}</p>
            </div>
          )}

          {testCase.test_data && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-2">Test Data</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testCase.test_data}</p>
            </div>
          )}

          <div className="rounded-lg border bg-card p-4">
            <TestStepEditor steps={steps} onChange={() => {}} readOnly />
          </div>

          {testCase.expected_results && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-2">Expected Results</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{testCase.expected_results}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          {canEdit && (
            <TestCaseActions
              testCaseId={testCase.test_case_id}
              currentStatus={testCase.status}
              isAiGenerated={testCase.is_ai_generated}
              humanReviewed={testCase.human_reviewed}
            />
          )}

          {/* Details */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{testCase.test_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Steps</span>
                <span>{steps.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>v{testCase.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(testCase.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created by</span>
                <span>{creator?.name || "Unknown"}</span>
              </div>
              {testCase.is_ai_generated && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Model</span>
                  <span className="inline-flex items-center gap-1 text-violet-600">
                    <Sparkles className="h-3 w-3" />
                    {testCase.ai_model_used || "Claude"}
                  </span>
                </div>
              )}
              {testCase.human_reviewed && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviewed by</span>
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    {reviewerName || "Unknown"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
