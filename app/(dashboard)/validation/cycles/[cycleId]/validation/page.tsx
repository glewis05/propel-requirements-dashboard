import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getCycleById } from "../../cycle-actions"
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Users, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidationPageProps {
  params: Promise<{ cycleId: string }>
}

interface CVComparison {
  group_id: string
  test_case_id: string
  test_case_title: string
  execution_id: string
  assigned_to: string
  tester_name: string
  status: string
  step_results: unknown[]
  completed_at: string | null
  notes: string | null
}

export default async function ValidationPage({ params }: ValidationPageProps) {
  const { cycleId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single()

  if (!profile || !["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(profile.role || "")) {
    redirect("/uat")
  }

  const cycleResult = await getCycleById(cycleId)
  if (!cycleResult.success || !cycleResult.cycle) {
    notFound()
  }

  const cycle = cycleResult.cycle

  if (!cycle.cross_validation_enabled) {
    return (
      <div className="space-y-6">
        <Link
          href={`/uat/cycles/${cycleId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycle
        </Link>
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800">
          Cross-validation is not enabled for this cycle.
        </div>
      </div>
    )
  }

  // Get cross-validation comparison data
  const { data: comparisons, error } = await supabase
    .from("cross_validation_comparison")
    .select("*")
    .eq("cycle_id", cycleId)
    .order("test_case_title", { ascending: true }) as { data: CVComparison[] | null; error: Error | null }

  // Group by test case
  const groupedComparisons = new Map<string, CVComparison[]>()
  if (comparisons) {
    for (const row of comparisons) {
      const existing = groupedComparisons.get(row.group_id) || []
      existing.push(row)
      groupedComparisons.set(row.group_id, existing)
    }
  }

  // Calculate statistics
  const groups = Array.from(groupedComparisons.values())
  const totalGroups = groups.length
  const completedGroups = groups.filter(g => g.every(e => ["passed", "failed", "blocked", "verified"].includes(e.status))).length
  const agreementGroups = groups.filter(g => {
    const statuses = g.map(e => e.status === "verified" ? "passed" : e.status)
    const unique = new Set(statuses.filter(s => s !== "blocked"))
    return unique.size <= 1 && g.every(e => ["passed", "failed", "blocked", "verified"].includes(e.status))
  }).length
  const discrepancyGroups = completedGroups - agreementGroups

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/uat/cycles/${cycleId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycle
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Cross-Validation Results</h1>
        <p className="text-muted-foreground">{cycle.name}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Groups"
          value={totalGroups}
          icon={<Users className="h-4 w-4" />}
          color="text-foreground bg-muted"
        />
        <StatCard
          label="Completed"
          value={completedGroups}
          icon={<CheckCircle className="h-4 w-4" />}
          color="text-blue-600 bg-blue-100"
        />
        <StatCard
          label="In Agreement"
          value={agreementGroups}
          icon={<CheckCircle className="h-4 w-4" />}
          color="text-green-600 bg-green-100"
        />
        <StatCard
          label="Discrepancies"
          value={discrepancyGroups}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-red-600 bg-red-100"
        />
      </div>

      {/* Validation Groups */}
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No cross-validation assignments</h3>
          <p className="mt-2 text-muted-foreground">
            Run the assignment process to create cross-validation groups.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <ValidationGroupCard key={group[0].group_id} executions={group} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className={cn("inline-flex items-center justify-center gap-2 rounded-full px-3 py-1", color)}>
        {icon}
        <span className="text-xl font-bold">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
    </div>
  )
}

function ValidationGroupCard({ executions }: { executions: CVComparison[] }) {
  const testCaseTitle = executions[0]?.test_case_title || "Unknown Test"
  const allComplete = executions.every(e => ["passed", "failed", "blocked", "verified"].includes(e.status))

  // Determine agreement
  const completedStatuses = executions
    .filter(e => ["passed", "failed", "blocked", "verified"].includes(e.status))
    .map(e => e.status === "verified" ? "passed" : e.status)

  const passCount = completedStatuses.filter(s => s === "passed").length
  const failCount = completedStatuses.filter(s => s === "failed").length
  const blockedCount = completedStatuses.filter(s => s === "blocked").length

  let agreementStatus: "pending" | "agree" | "disagree" = "pending"
  if (allComplete) {
    if (passCount === executions.length || failCount === executions.length) {
      agreementStatus = "agree"
    } else if (blockedCount > 0 && (passCount > 0 || failCount > 0)) {
      agreementStatus = "disagree"
    } else if (passCount > 0 && failCount > 0) {
      agreementStatus = "disagree"
    } else {
      agreementStatus = "agree" // All blocked
    }
  }

  return (
    <div className={cn(
      "rounded-lg border bg-card overflow-hidden",
      agreementStatus === "disagree" && "border-red-200",
      agreementStatus === "agree" && "border-green-200"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 flex items-center justify-between",
        agreementStatus === "disagree" && "bg-red-50",
        agreementStatus === "agree" && "bg-green-50"
      )}>
        <div>
          <h3 className="font-medium">{testCaseTitle}</h3>
          <p className="text-sm text-muted-foreground">{executions.length} testers assigned</p>
        </div>
        <AgreementBadge status={agreementStatus} />
      </div>

      {/* Testers */}
      <div className="divide-y">
        {executions.map((exec) => (
          <div key={exec.execution_id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {exec.tester_name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{exec.tester_name}</p>
                {exec.completed_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(exec.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <ExecutionStatusBadge status={exec.status} />
          </div>
        ))}
      </div>

      {/* Notes (if any discrepancy) */}
      {agreementStatus === "disagree" && (
        <div className="p-3 border-t bg-red-50/50">
          <p className="text-xs text-red-700 font-medium mb-1">Review Needed</p>
          <p className="text-xs text-red-600">
            Testers have different results for this test case. Please review and resolve.
          </p>
        </div>
      )}
    </div>
  )
}

function AgreementBadge({ status }: { status: "pending" | "agree" | "disagree" }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
        <Clock className="h-3 w-3" />
        In Progress
      </span>
    )
  }
  if (status === "agree") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        <CheckCircle className="h-3 w-3" />
        Agreement
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
      <AlertTriangle className="h-3 w-3" />
      Discrepancy
    </span>
  )
}

function ExecutionStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    assigned: {
      label: "Not Started",
      color: "bg-gray-100 text-gray-600",
      icon: <Clock className="h-3 w-3" />,
    },
    in_progress: {
      label: "In Progress",
      color: "bg-blue-100 text-blue-600",
      icon: <Clock className="h-3 w-3" />,
    },
    passed: {
      label: "Passed",
      color: "bg-green-100 text-green-700",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    verified: {
      label: "Verified",
      color: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    failed: {
      label: "Failed",
      color: "bg-red-100 text-red-700",
      icon: <XCircle className="h-3 w-3" />,
    },
    blocked: {
      label: "Blocked",
      color: "bg-orange-100 text-orange-700",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  }

  const cfg = config[status] || config.assigned

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", cfg.color)}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}
