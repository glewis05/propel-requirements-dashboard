import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ClipboardList, CheckCircle2, Clock, AlertCircle, PlayCircle, Shield } from "lucide-react"
import Link from "next/link"
import type { ExecutionStatus } from "@/types/database"

// Force dynamic rendering
export const dynamic = "force-dynamic"

interface TestExecution {
  execution_id: string
  status: ExecutionStatus
  cycle_id: string | null
  cycle_name: string | null
  assigned_at: string
  started_at: string | null
  completed_at: string | null
  test_case: {
    test_case_id: string
    title: string
    priority: string
    test_type: string
  } | null
  story: {
    story_id: string
    title: string
  } | null
}

interface CycleInfo {
  cycle_id: string
  cycle_name: string
  hasAcknowledged: boolean
  testCount: number
}

export default async function MyTestsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login?redirect=/my-tests")
  }

  // Get user profile
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, name")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    redirect("/login?error=no_profile")
  }

  // Fetch assigned test executions for this user
  const { data: executions, error } = await supabase
    .from("test_executions")
    .select(`
      execution_id,
      status,
      cycle_id,
      cycle_name,
      assigned_at,
      started_at,
      completed_at,
      test_cases!test_executions_test_case_id_fkey (
        test_case_id,
        title,
        priority,
        test_type
      ),
      user_stories!test_executions_story_id_fkey (
        story_id,
        title
      )
    `)
    .eq("assigned_to", userData.user_id)
    .order("assigned_at", { ascending: false })

  if (error) {
    console.error("Error fetching executions:", error)
  }

  // Transform data
  const testExecutions: TestExecution[] = (executions || []).map((exec: Record<string, unknown>) => ({
    execution_id: exec.execution_id as string,
    status: exec.status as ExecutionStatus,
    cycle_id: exec.cycle_id as string | null,
    cycle_name: exec.cycle_name as string | null,
    assigned_at: exec.assigned_at as string,
    started_at: exec.started_at as string | null,
    completed_at: exec.completed_at as string | null,
    test_case: exec.test_cases as TestExecution["test_case"],
    story: exec.user_stories as TestExecution["story"],
  }))

  // Get unique cycle IDs that have tests
  const cycleIds = [...new Set(testExecutions.filter(e => e.cycle_id).map(e => e.cycle_id as string))]

  // Fetch acknowledgments for these cycles
  const { data: acknowledgments } = cycleIds.length > 0
    ? await supabase
        .from("tester_acknowledgments")
        .select("cycle_id")
        .eq("user_id", userData.user_id)
        .in("cycle_id", cycleIds)
    : { data: [] }

  const acknowledgedCycleIds = new Set((acknowledgments || []).map((a: { cycle_id: string }) => a.cycle_id))

  // Build cycle info
  const cycleInfoMap = new Map<string, CycleInfo>()
  testExecutions.forEach(exec => {
    if (exec.cycle_id && exec.cycle_name) {
      if (!cycleInfoMap.has(exec.cycle_id)) {
        cycleInfoMap.set(exec.cycle_id, {
          cycle_id: exec.cycle_id,
          cycle_name: exec.cycle_name,
          hasAcknowledged: acknowledgedCycleIds.has(exec.cycle_id),
          testCount: 0,
        })
      }
      cycleInfoMap.get(exec.cycle_id)!.testCount++
    }
  })

  // Calculate stats
  const stats = {
    total: testExecutions.length,
    notStarted: testExecutions.filter(e => e.status === "assigned").length,
    inProgress: testExecutions.filter(e => e.status === "in_progress").length,
    completed: testExecutions.filter(e => ["passed", "failed", "blocked", "verified"].includes(e.status)).length,
  }

  // Group by cycle
  const byCycle = testExecutions.reduce((acc, exec) => {
    const cycleKey = exec.cycle_id || "unassigned"
    const cycleName = exec.cycle_name || "Unassigned"
    if (!acc[cycleKey]) {
      acc[cycleKey] = {
        name: cycleName,
        cycleId: exec.cycle_id,
        executions: [],
        info: exec.cycle_id ? cycleInfoMap.get(exec.cycle_id) : null,
      }
    }
    acc[cycleKey].executions.push(exec)
    return acc
  }, {} as Record<string, { name: string; cycleId: string | null; executions: TestExecution[]; info: CycleInfo | null }>)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Tests</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {userData.name}. Here are your assigned test cases.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Assigned"
          value={stats.total}
          icon={<ClipboardList className="h-5 w-5 text-primary" />}
        />
        <StatCard
          label="Not Started"
          value={stats.notStarted}
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={<PlayCircle className="h-5 w-5 text-warning" />}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
        />
      </div>

      {/* Test List */}
      {testExecutions.length === 0 ? (
        <div className="rounded-lg bg-card border border-border p-8 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground">No Tests Assigned</h2>
          <p className="text-muted-foreground mt-2">
            You don&apos;t have any tests assigned yet. Check back later or contact your UAT Manager.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCycle).map(([cycleKey, cycleData]) => {
            const needsAcknowledgment = cycleData.info && !cycleData.info.hasAcknowledged

            return (
              <div key={cycleKey} className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {cycleData.name}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({cycleData.executions.length} tests)
                  </span>
                  {needsAcknowledgment && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                      <Shield className="h-3 w-3" />
                      Acknowledgment Required
                    </span>
                  )}
                </h2>

                {needsAcknowledgment ? (
                  <div className="rounded-lg bg-warning/5 border border-warning/20 p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Complete Acknowledgment to Access Tests
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Before you can execute tests in this cycle, you must review and acknowledge
                          the testing requirements for compliance purposes.
                        </p>
                        <Link
                          href={`/acknowledge/${cycleData.cycleId}?cycleName=${encodeURIComponent(cycleData.name)}&redirect=/my-tests`}
                          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                        >
                          <Shield className="h-4 w-4" />
                          Complete Acknowledgment
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cycleData.executions.map((execution) => (
                      <TestCard key={execution.execution_id} execution={execution} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-card border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {icon}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function TestCard({ execution }: { execution: TestExecution }) {
  const statusConfig: Record<ExecutionStatus, { label: string; color: string; icon: React.ReactNode }> = {
    assigned: {
      label: "Not Started",
      color: "bg-muted text-muted-foreground",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    in_progress: {
      label: "In Progress",
      color: "bg-warning/10 text-warning border-warning/20",
      icon: <PlayCircle className="h-3.5 w-3.5" />,
    },
    passed: {
      label: "Passed",
      color: "bg-success/10 text-success border-success/20",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    failed: {
      label: "Failed",
      color: "bg-destructive/10 text-destructive border-destructive/20",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    blocked: {
      label: "Blocked",
      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    verified: {
      label: "Verified",
      color: "bg-success/10 text-success border-success/20",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
  }

  const status = statusConfig[execution.status] || statusConfig.assigned
  const priorityColors: Record<string, string> = {
    critical: "text-destructive",
    high: "text-warning",
    medium: "text-primary",
    low: "text-muted-foreground",
  }

  const canExecute = execution.status === "assigned" || execution.status === "in_progress"

  return (
    <Link
      href={`/execute/${execution.execution_id}`}
      className="block rounded-lg bg-card border border-border p-4 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-foreground truncate">
              {execution.test_case?.title || "Unknown Test"}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="truncate">{execution.story?.title || "No story"}</span>
            {execution.test_case?.priority && (
              <span className={`text-xs font-medium ${priorityColors[execution.test_case.priority] || ""}`}>
                {execution.test_case.priority}
              </span>
            )}
            {execution.test_case?.test_type && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {execution.test_case.test_type}
              </span>
            )}
          </div>
        </div>
        {canExecute && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md">
              {execution.status === "in_progress" ? "Continue" : "Start"}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
