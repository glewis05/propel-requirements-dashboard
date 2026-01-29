"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Calendar, Users, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react"

interface CycleInfo {
  cycle_id: string
  name: string
  description: string | null
  program_name: string
  status: string
  start_date: string | null
  end_date: string | null
  active_testers: number
  total_assignments: number
  completed_count: number
  failed_count: number
  blocked_count: number
  pending_count: number
}

interface CycleSelectorProps {
  cycles: CycleInfo[]
}

export function CycleSelector({ cycles }: CycleSelectorProps) {
  if (cycles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Calendar className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Cycles</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          You are not currently assigned to any active testing cycles. Please contact your UAT Manager if you believe this is an error.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cycles.map((cycle) => (
        <CycleCard key={cycle.cycle_id} cycle={cycle} />
      ))}
    </div>
  )
}

function CycleCard({ cycle }: { cycle: CycleInfo }) {
  const total = cycle.total_assignments || 0
  const completed = cycle.completed_count || 0
  const failed = cycle.failed_count || 0
  const blocked = cycle.blocked_count || 0
  const pending = cycle.pending_count || 0
  const progressPercent = total > 0 ? Math.round(((completed + failed + blocked) / total) * 100) : 0

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Link
      href={`/tester/cycle/${cycle.cycle_id}`}
      className={cn(
        "block rounded-xl border bg-white p-5 transition-all",
        "hover:border-primary/50 hover:shadow-md",
        cycle.status === "active" && "border-primary/20"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{cycle.name}</h3>
          <p className="text-sm text-gray-500">{cycle.program_name}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            cycle.status === "active" && "bg-green-100 text-green-700",
            cycle.status === "completed" && "bg-blue-100 text-blue-700",
            cycle.status === "draft" && "bg-gray-100 text-gray-700"
          )}
        >
          {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
        </span>
      </div>

      {/* Description */}
      {cycle.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cycle.description}</p>
      )}

      {/* Dates */}
      {(cycle.start_date || cycle.end_date) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {formatDate(cycle.start_date)}
            {cycle.end_date && ` - ${formatDate(cycle.end_date)}`}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 pt-3 border-t">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold text-gray-900">{pending}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Pending</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            <span className="font-semibold text-gray-900">{completed}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Passed</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-red-600" />
            <span className="font-semibold text-gray-900">{failed}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Failed</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
            <span className="font-semibold text-gray-900">{blocked}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Blocked</p>
        </div>
      </div>
    </Link>
  )
}
