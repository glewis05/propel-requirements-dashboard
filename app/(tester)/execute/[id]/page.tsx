import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, AlertCircle } from "lucide-react"
import { ExecutionRunner } from "@/components/uat/executions/ExecutionRunner"
import type { ExecutionStatus, TestStep, StepResult, UserRole } from "@/types/database"

// Force dynamic rendering
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ExecuteTestPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirect=/execute/${id}`)
  }

  // Get user profile
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, name, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    redirect("/login?error=no_profile")
  }

  const userRole = userData.role as UserRole

  // Fetch the execution with related data
  const { data: execution, error } = await supabase
    .from("test_executions")
    .select(`
      execution_id,
      status,
      cycle_id,
      cycle_name,
      assigned_to,
      assigned_at,
      started_at,
      completed_at,
      step_results,
      environment,
      browser_device,
      notes,
      test_cases!test_executions_test_case_id_fkey (
        test_case_id,
        title,
        description,
        preconditions,
        test_data,
        test_steps,
        expected_results,
        test_type,
        priority
      ),
      user_stories!test_executions_story_id_fkey (
        story_id,
        title,
        user_story,
        acceptance_criteria
      )
    `)
    .eq("execution_id", id)
    .single()

  if (error || !execution) {
    console.error("Error fetching execution:", error)
    notFound()
  }

  // Check if user is assigned to this test
  const isAssignedToMe = execution.assigned_to === userData.user_id

  // Testers can only access their own tests
  if (userRole === "UAT Tester" && !isAssignedToMe) {
    redirect("/my-tests?error=not_assigned")
  }

  // Check if tester has acknowledged this cycle (if cycle exists)
  const cycleId = execution.cycle_id as string | null
  if (cycleId && userRole === "UAT Tester") {
    const { data: acknowledgment } = await supabase
      .from("tester_acknowledgments")
      .select("acknowledgment_id")
      .eq("user_id", userData.user_id)
      .eq("cycle_id", cycleId)
      .single()

    if (!acknowledgment) {
      // Redirect to acknowledgment page
      const cycleName = execution.cycle_name as string || "Test Cycle"
      redirect(`/acknowledge/${cycleId}?cycleName=${encodeURIComponent(cycleName)}&redirect=/execute/${id}`)
    }
  }

  const testCase = execution.test_cases as {
    test_case_id: string
    title: string
    description: string | null
    preconditions: string | null
    test_data: string | null
    test_steps: TestStep[]
    expected_results: string | null
    test_type: string
    priority: string
  } | null

  const story = execution.user_stories as {
    story_id: string
    title: string
    user_story: string | null
    acceptance_criteria: string | null
  } | null

  const testSteps: TestStep[] = testCase?.test_steps || []
  const stepResults: StepResult[] = (execution.step_results as StepResult[]) || []

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/my-tests"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Tests
      </Link>

      {/* Test Case Header */}
      <div className="rounded-lg bg-card border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="font-mono bg-muted px-2 py-0.5 rounded">
                {testCase?.test_case_id || "Unknown"}
              </span>
              {execution.cycle_name && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {execution.cycle_name}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {testCase?.title || "Unknown Test Case"}
            </h1>
            {testCase?.description && (
              <p className="text-muted-foreground mt-2">{testCase.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-sm">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              testCase?.priority === "critical" ? "bg-destructive/10 text-destructive" :
              testCase?.priority === "high" ? "bg-warning/10 text-warning" :
              testCase?.priority === "medium" ? "bg-primary/10 text-primary" :
              "bg-muted text-muted-foreground"
            }`}>
              {testCase?.priority || "normal"}
            </span>
            <span className="text-xs text-muted-foreground">{testCase?.test_type}</span>
          </div>
        </div>

        {/* Related Story */}
        {story && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span>Related Story</span>
            </div>
            <p className="text-sm font-medium">{story.title}</p>
            <p className="text-xs text-muted-foreground font-mono">{story.story_id}</p>
          </div>
        )}
      </div>

      {/* Preconditions & Test Data */}
      {(testCase?.preconditions || testCase?.test_data) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testCase?.preconditions && (
            <div className="rounded-lg bg-card border border-border p-4">
              <h2 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Preconditions
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {testCase.preconditions}
              </p>
            </div>
          )}
          {testCase?.test_data && (
            <div className="rounded-lg bg-card border border-border p-4">
              <h2 className="font-medium text-foreground mb-2">Test Data</h2>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-2 rounded">
                {testCase.test_data}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Execution Runner */}
      <div className="rounded-lg bg-card border border-border p-6">
        <ExecutionRunner
          executionId={execution.execution_id}
          testSteps={testSteps}
          stepResults={stepResults}
          status={execution.status as ExecutionStatus}
          userRole={userRole}
          isAssignedToMe={isAssignedToMe}
        />
      </div>

      {/* Expected Results Reference */}
      {testCase?.expected_results && (
        <div className="rounded-lg bg-muted/30 border border-border p-4">
          <h2 className="font-medium text-foreground mb-2">Expected Results (Reference)</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {testCase.expected_results}
          </p>
        </div>
      )}

      {/* Acceptance Criteria Reference */}
      {story?.acceptance_criteria && (
        <div className="rounded-lg bg-muted/30 border border-border p-4">
          <h2 className="font-medium text-foreground mb-2">Acceptance Criteria (Reference)</h2>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
            {story.acceptance_criteria}
          </pre>
        </div>
      )}
    </div>
  )
}
