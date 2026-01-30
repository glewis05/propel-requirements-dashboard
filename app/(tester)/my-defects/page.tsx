import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Bug, AlertCircle, CheckCircle2, Clock, ExternalLink } from "lucide-react"
import type { DefectSeverity, DefectStatus } from "@/types/database"

// Force dynamic rendering
export const dynamic = "force-dynamic"

interface Defect {
  defect_id: string
  title: string
  severity: DefectSeverity
  status: DefectStatus
  created_at: string
  story: {
    story_id: string
    title: string
  } | null
  test_case: {
    test_case_id: string
    title: string
  } | null
}

export default async function MyDefectsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login?redirect=/my-defects")
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

  // Fetch defects reported by this user
  const { data: defects, error } = await supabase
    .from("defects")
    .select(`
      defect_id,
      title,
      severity,
      status,
      created_at,
      user_stories!defects_story_id_fkey (
        story_id,
        title
      ),
      test_cases!defects_test_case_id_fkey (
        test_case_id,
        title
      )
    `)
    .eq("reported_by", userData.user_id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching defects:", error)
  }

  const myDefects: Defect[] = (defects || []).map((d: Record<string, unknown>) => ({
    defect_id: d.defect_id as string,
    title: d.title as string,
    severity: d.severity as DefectSeverity,
    status: d.status as DefectStatus,
    created_at: d.created_at as string,
    story: d.user_stories as Defect["story"],
    test_case: d.test_cases as Defect["test_case"],
  }))

  // Calculate stats
  const stats = {
    total: myDefects.length,
    open: myDefects.filter(d => ["open", "confirmed", "in_progress"].includes(d.status)).length,
    fixed: myDefects.filter(d => ["fixed", "verified"].includes(d.status)).length,
    closed: myDefects.filter(d => d.status === "closed").length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Defects</h1>
        <p className="text-muted-foreground mt-1">
          Defects you&apos;ve reported during testing
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Reported"
          value={stats.total}
          icon={<Bug className="h-5 w-5 text-primary" />}
        />
        <StatCard
          label="Open"
          value={stats.open}
          icon={<AlertCircle className="h-5 w-5 text-warning" />}
        />
        <StatCard
          label="Fixed"
          value={stats.fixed}
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
        />
        <StatCard
          label="Closed"
          value={stats.closed}
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      {/* Defects List */}
      {myDefects.length === 0 ? (
        <div className="rounded-lg bg-card border border-border p-8 text-center">
          <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground">No Defects Reported</h2>
          <p className="text-muted-foreground mt-2">
            You haven&apos;t reported any defects yet. When you find issues during testing,
            you can report them directly from the test execution screen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {myDefects.map((defect) => (
            <DefectCard key={defect.defect_id} defect={defect} />
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

function DefectCard({ defect }: { defect: Defect }) {
  const severityColors: Record<DefectSeverity, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-warning/10 text-warning border-warning/20",
    medium: "bg-primary/10 text-primary border-primary/20",
    low: "bg-muted text-muted-foreground",
  }

  const statusColors: Record<DefectStatus, string> = {
    open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    confirmed: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    fixed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    closed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  }

  const statusLabels: Record<DefectStatus, string> = {
    open: "Open",
    confirmed: "Confirmed",
    in_progress: "In Progress",
    fixed: "Fixed",
    verified: "Verified",
    closed: "Closed",
  }

  return (
    <div className="rounded-lg bg-card border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${severityColors[defect.severity]}`}>
              {defect.severity}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[defect.status]}`}>
              {statusLabels[defect.status]}
            </span>
          </div>
          <h3 className="font-medium text-foreground">{defect.title}</h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            {defect.story && (
              <span className="truncate">{defect.story.title}</span>
            )}
            <span className="text-xs">
              {new Date(defect.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Link
          href={`/uat/defects/${defect.defect_id}`}
          className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="View details"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
