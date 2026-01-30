import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getCycleById } from "../cycle-actions"
import { getCycleTesterWorkload } from "../tester-pool-actions"
import { getAssignmentDistribution } from "../assignment-actions"
import {
  ArrowLeft,
  Settings,
  Users,
  FileText,
  PlayCircle,
  BarChart3,
  Calendar,
  Lock,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CycleActionsMenu } from "./cycle-actions-menu"

interface CycleDetailPageProps {
  params: Promise<{ cycleId: string }>
}

export default async function CycleDetailPage({ params }: CycleDetailPageProps) {
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
  const workloadResult = await getCycleTesterWorkload(cycleId)
  const workload = workloadResult.success ? workloadResult.workload || [] : []

  // Calculate summary stats
  const totalTesters = workload.filter((w) => w.is_active).length
  const totalAssigned = workload.reduce((sum, w) => sum + (w.total_assigned || 0), 0)
  const totalCompleted = workload.reduce((sum, w) => sum + (w.completed || 0), 0)
  const totalFailed = workload.reduce((sum, w) => sum + (w.failed || 0), 0)
  const totalBlocked = workload.reduce((sum, w) => sum + (w.blocked || 0), 0)
  const totalPending = workload.reduce((sum, w) => sum + (w.not_started || 0) + (w.in_progress || 0), 0)
  const progressPercent = totalAssigned > 0 ? Math.round(((totalCompleted + totalFailed + totalBlocked) / totalAssigned) * 100) : 0

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    active: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    archived: "bg-gray-100 text-gray-500 border-gray-200",
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/validation/cycles"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycles
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{cycle.name}</h1>
              {cycle.locked_at && (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            {cycle.description && (
              <p className="text-muted-foreground mt-1">{cycle.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium border",
                statusColors[cycle.status]
              )}
            >
              {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
            </span>
            <CycleActionsMenu cycleId={cycleId} status={cycle.status} isLocked={!!cycle.locked_at} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ActionCard
          href={`/uat/cycles/${cycleId}/testers`}
          icon={<Users className="h-5 w-5" />}
          label="Manage Testers"
          description={`${totalTesters} active`}
          disabled={!!cycle.locked_at}
        />
        <ActionCard
          href={`/uat/cycles/${cycleId}/tests`}
          icon={<FileText className="h-5 w-5" />}
          label="Select Tests"
          description="Choose test cases"
          disabled={!!cycle.locked_at}
        />
        <ActionCard
          href={`/uat/cycles/${cycleId}/assign`}
          icon={<PlayCircle className="h-5 w-5" />}
          label="Run Assignment"
          description="Distribute tests"
          disabled={!!cycle.locked_at || totalTesters === 0}
        />
        <ActionCard
          href={`/uat/cycles/${cycleId}/validation`}
          icon={<BarChart3 className="h-5 w-5" />}
          label="Validation Results"
          description="Cross-validation"
          disabled={!cycle.cross_validation_enabled}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Tests"
          value={totalAssigned}
          icon={<FileText className="h-4 w-4" />}
          color="text-foreground bg-muted"
        />
        <StatCard
          label="Pending"
          value={totalPending}
          icon={<Clock className="h-4 w-4" />}
          color="text-blue-600 bg-blue-100"
        />
        <StatCard
          label="Passed"
          value={totalCompleted}
          icon={<CheckCircle className="h-4 w-4" />}
          color="text-green-600 bg-green-100"
        />
        <StatCard
          label="Failed"
          value={totalFailed}
          icon={<XCircle className="h-4 w-4" />}
          color="text-red-600 bg-red-100"
        />
        <StatCard
          label="Blocked"
          value={totalBlocked}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-orange-600 bg-orange-100"
        />
      </div>

      {/* Progress */}
      {totalAssigned > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Overall Progress</h2>
            <span className="text-sm text-muted-foreground">{progressPercent}% complete</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Cycle Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Distribution Method</dt>
              <dd className="font-medium capitalize">{cycle.distribution_method}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cross-Validation</dt>
              <dd className="font-medium">{cycle.cross_validation_enabled ? "Enabled" : "Disabled"}</dd>
            </div>
            {cycle.cross_validation_enabled && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">CV Percentage</dt>
                  <dd className="font-medium">{cycle.cross_validation_percentage}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Validators per Test</dt>
                  <dd className="font-medium">{cycle.validators_per_test}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {/* Schedule */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Start Date</dt>
              <dd className="font-medium">{formatDate(cycle.start_date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">End Date</dt>
              <dd className="font-medium">{formatDate(cycle.end_date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(cycle.created_at)}</dd>
            </div>
            {cycle.locked_at && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Locked</dt>
                <dd className="font-medium">{formatDate(cycle.locked_at)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Tester Workload */}
      {workload.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Tester Workload</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium">Tester</th>
                  <th className="text-center p-3 font-medium">Capacity</th>
                  <th className="text-center p-3 font-medium">Total</th>
                  <th className="text-center p-3 font-medium">Pending</th>
                  <th className="text-center p-3 font-medium">Passed</th>
                  <th className="text-center p-3 font-medium">Failed</th>
                  <th className="text-center p-3 font-medium">Blocked</th>
                </tr>
              </thead>
              <tbody>
                {workload.map((w) => (
                  <tr key={w.user_id} className="border-t">
                    <td className="p-3">
                      <span className={cn(!w.is_active && "text-muted-foreground")}>
                        {w.tester_name}
                        {!w.is_active && " (inactive)"}
                      </span>
                    </td>
                    <td className="text-center p-3">{w.capacity_weight}%</td>
                    <td className="text-center p-3 font-medium">{w.total_assigned}</td>
                    <td className="text-center p-3 text-blue-600">{w.not_started + w.in_progress}</td>
                    <td className="text-center p-3 text-green-600">{w.completed}</td>
                    <td className="text-center p-3 text-red-600">{w.failed}</td>
                    <td className="text-center p-3 text-orange-600">{w.blocked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionCard({
  href,
  icon,
  label,
  description,
  disabled,
}: {
  href: string
  icon: React.ReactNode
  label: string
  description: string
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">{icon}</div>
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="rounded-lg border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
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
