import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getAllCycles } from "./cycle-actions"
import { Plus, RefreshCw, Calendar, Users, CheckCircle, Clock, AlertTriangle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "UAT Cycles | Providence Healthcare",
  description: "Manage UAT testing cycles",
}

export default async function CyclesPage() {
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

  const cyclesResult = await getAllCycles()
  const cycles = cyclesResult.success ? cyclesResult.cycles || [] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">UAT Cycles</h1>
          <p className="text-muted-foreground">
            Manage testing cycles, tester assignments, and cross-validation
          </p>
        </div>
        <Link
          href="/validation/cycles/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Cycle
        </Link>
      </div>

      {/* Cycles List */}
      {cycles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No cycles yet</h3>
          <p className="mt-2 text-muted-foreground">
            Create your first UAT cycle to start organizing test assignments.
          </p>
          <Link
            href="/validation/cycles/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Cycle
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cycles.map((cycle) => (
            <CycleCard key={cycle.cycle_id} cycle={cycle} />
          ))}
        </div>
      )}
    </div>
  )
}

interface CycleCardProps {
  cycle: {
    cycle_id: string
    name: string
    description: string | null
    program_name?: string
    status: string
    start_date: string | null
    end_date: string | null
    locked_at: string | null
    active_testers?: number
    total_assignments?: number
    completed_count?: number
    failed_count?: number
    pending_count?: number
    cross_validation_enabled: boolean
  }
}

function CycleCard({ cycle }: CycleCardProps) {
  const total = cycle.total_assignments || 0
  const completed = cycle.completed_count || 0
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    archived: "bg-gray-100 text-gray-500",
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Link
      href={`/uat/cycles/${cycle.cycle_id}`}
      className="block rounded-lg border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{cycle.name}</h3>
            {cycle.locked_at && (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{cycle.program_name}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[cycle.status])}>
          {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
        </span>
      </div>

      {/* Description */}
      {cycle.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {cycle.description}
        </p>
      )}

      {/* Dates */}
      {(cycle.start_date || cycle.end_date) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {formatDate(cycle.start_date)}
            {cycle.end_date && ` - ${formatDate(cycle.end_date)}`}
          </span>
        </div>
      )}

      {/* Progress */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{progressPercent}% ({completed}/{total})</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center gap-4 pt-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>{cycle.active_testers || 0} testers</span>
        </div>
        {cycle.cross_validation_enabled && (
          <div className="flex items-center gap-1 text-purple-600">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Cross-val</span>
          </div>
        )}
        {(cycle.pending_count || 0) > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{cycle.pending_count} pending</span>
          </div>
        )}
        {(cycle.failed_count || 0) > 0 && (
          <div className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{cycle.failed_count} failed</span>
          </div>
        )}
      </div>
    </Link>
  )
}
