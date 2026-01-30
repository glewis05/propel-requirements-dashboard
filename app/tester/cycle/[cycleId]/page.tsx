import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { checkCycleAccess, getTesterCycleSummary, getMyAssignedTests } from "@/app/(tester)/actions"
import { TestQueue } from "@/components/tester/TestQueue"
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, BarChart3 } from "lucide-react"

interface CycleDashboardPageProps {
  params: Promise<{ cycleId: string }>
}

export default async function CycleDashboardPage({ params }: CycleDashboardPageProps) {
  const { cycleId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/tester")
  }

  // Check cycle access
  const accessResult = await checkCycleAccess(cycleId)

  if (!accessResult.success || !accessResult.hasAccess) {
    notFound()
  }

  // Redirect to acknowledgment if needed
  if (accessResult.needsAcknowledgment) {
    redirect(`/tester/cycle/${cycleId}/acknowledge`)
  }

  // Get cycle summary and assignments
  const [summaryResult, assignmentsResult] = await Promise.all([
    getTesterCycleSummary(cycleId),
    getMyAssignedTests(cycleId),
  ])

  if (!summaryResult.success || !summaryResult.cycle) {
    notFound()
  }

  const cycle = summaryResult.cycle
  const workload = summaryResult.workload
  const assignments = assignmentsResult.success ? assignmentsResult.assignments || [] : []

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/tester"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Cycles
      </Link>

      {/* Cycle Header */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cycle.name}</h1>
            <p className="text-gray-500">{cycle.program_name}</p>
            {cycle.description && (
              <p className="text-gray-600 mt-2">{cycle.description}</p>
            )}
          </div>
          <span className="shrink-0 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
          </span>
        </div>

        {/* Progress Stats */}
        <div className="mt-6 pt-6 border-t grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard
            label="Total"
            value={workload.total_assigned}
            icon={<BarChart3 className="h-4 w-4" />}
            color="text-gray-600 bg-gray-100"
          />
          <StatCard
            label="Pending"
            value={workload.not_started + workload.in_progress}
            icon={<Clock className="h-4 w-4" />}
            color="text-blue-600 bg-blue-100"
          />
          <StatCard
            label="Passed"
            value={workload.completed}
            icon={<CheckCircle className="h-4 w-4" />}
            color="text-green-600 bg-green-100"
          />
          <StatCard
            label="Failed"
            value={workload.failed}
            icon={<XCircle className="h-4 w-4" />}
            color="text-red-600 bg-red-100"
          />
          <StatCard
            label="Blocked"
            value={workload.blocked}
            icon={<AlertTriangle className="h-4 w-4" />}
            color="text-orange-600 bg-orange-100"
          />
        </div>
      </div>

      {/* Test Queue */}
      <TestQueue cycleId={cycleId} assignments={assignments} />
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
    <div className="rounded-lg border bg-white p-3 text-center">
      <div className={`inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-1 ${color}`}>
        {icon}
        <span className="text-lg font-bold">{value}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
