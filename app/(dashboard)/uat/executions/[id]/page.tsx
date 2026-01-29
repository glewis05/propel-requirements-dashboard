import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ExecutionRunner } from "@/components/uat/executions/ExecutionRunner"
import { cn } from "@/lib/utils"
import type { ExecutionStatus, TestStep, StepResult, UserRole } from "@/types/database"
import { ArrowLeft, User, Clock, Globe, Layers } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ExecutionDetailPage({ params }: PageProps) {
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

  interface ExecutionRow {
    execution_id: string
    test_case_id: string
    story_id: string
    assigned_to: string
    assigned_by: string
    assigned_at: string
    status: ExecutionStatus
    step_results: StepResult[]
    started_at: string | null
    completed_at: string | null
    verified_by: string | null
    verified_at: string | null
    environment: string | null
    browser_device: string | null
    cycle_name: string | null
    notes: string | null
    created_at: string
    updated_at: string
  }

  const { data: execution, error } = await supabase
    .from("test_executions")
    .select("*")
    .eq("execution_id", id)
    .single() as { data: ExecutionRow | null; error: Error | null }

  if (error || !execution) {
    notFound()
  }

  // Fetch test case
  interface TestCaseRow {
    test_case_id: string
    title: string
    description: string | null
    test_steps: TestStep[]
    preconditions: string | null
  }

  const { data: testCase } = await supabase
    .from("test_cases")
    .select("test_case_id, title, description, test_steps, preconditions")
    .eq("test_case_id", execution.test_case_id)
    .single() as { data: TestCaseRow | null; error: Error | null }

  // Fetch user names
  interface UserNameRow { user_id: string; name: string }
  const relevantUserIds = [execution.assigned_to, execution.assigned_by, execution.verified_by].filter(Boolean) as string[]
  const { data: relevantUsers } = await supabase
    .from("users")
    .select("user_id, name")
    .in("user_id", relevantUserIds) as { data: UserNameRow[] | null; error: Error | null }

  const userNameMap = new Map((relevantUsers || []).map(u => [u.user_id, u.name]))

  const testSteps: TestStep[] = testCase?.test_steps
    ? (Array.isArray(testCase.test_steps) ? testCase.test_steps : [])
    : []
  const stepResults: StepResult[] = Array.isArray(execution.step_results) ? execution.step_results : []

  const isAssignedToMe = execution.assigned_to === userData.user_id

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/uat/executions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Executions
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {testCase?.title || "Test Execution"}
        </h1>
        <p className="text-muted-foreground">
          Story: <Link href={`/stories/${execution.story_id}`} className="text-primary hover:underline">
            {execution.story_id}
          </Link>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Execution Runner */}
        <div className="lg:col-span-2">
          {testCase?.description && (
            <div className="rounded-lg border bg-card p-4 mb-4">
              <h3 className="font-medium mb-1">Description</h3>
              <p className="text-sm text-muted-foreground">{testCase.description}</p>
            </div>
          )}

          {testCase?.preconditions && (
            <div className="rounded-lg border bg-yellow-50 border-yellow-200 p-4 mb-4">
              <h3 className="font-medium mb-1 text-yellow-800">Preconditions</h3>
              <p className="text-sm text-yellow-700">{testCase.preconditions}</p>
            </div>
          )}

          <ExecutionRunner
            executionId={execution.execution_id}
            testSteps={testSteps}
            stepResults={stepResults}
            status={execution.status}
            userRole={userData.role as UserRole}
            isAssignedToMe={isAssignedToMe}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Execution Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <User className="h-3 w-3" /> Assigned to
                </span>
                <span>{userNameMap.get(execution.assigned_to) || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned by</span>
                <span>{userNameMap.get(execution.assigned_by) || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Assigned
                </span>
                <span>{new Date(execution.assigned_at).toLocaleDateString()}</span>
              </div>
              {execution.started_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span>{new Date(execution.started_at).toLocaleString()}</span>
                </div>
              )}
              {execution.completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{new Date(execution.completed_at).toLocaleString()}</span>
                </div>
              )}
              {execution.verified_by && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verified by</span>
                  <span>{userNameMap.get(execution.verified_by) || "Unknown"}</span>
                </div>
              )}
              {execution.environment && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Environment
                  </span>
                  <span>{execution.environment}</span>
                </div>
              )}
              {execution.browser_device && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Browser/Device</span>
                  <span>{execution.browser_device}</span>
                </div>
              )}
              {execution.cycle_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Cycle
                  </span>
                  <span>{execution.cycle_name}</span>
                </div>
              )}
            </div>
          </div>

          {execution.notes && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{execution.notes}</p>
            </div>
          )}

          {/* Step Progress */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium mb-2">Progress</h3>
            <div className="text-sm text-muted-foreground">
              {stepResults.length} of {testSteps.length} steps completed
            </div>
            <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-muted mt-2">
              {testSteps.length > 0 && stepResults.length > 0 && (
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(stepResults.length / testSteps.length) * 100}%` }}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <span className="text-green-600">
                {stepResults.filter(r => r.status === "passed").length} passed
              </span>
              <span className="text-red-600">
                {stepResults.filter(r => r.status === "failed").length} failed
              </span>
              <span className="text-orange-600">
                {stepResults.filter(r => r.status === "blocked").length} blocked
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
