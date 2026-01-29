"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Clock,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  FileText,
  Users,
} from "lucide-react"

interface TestAssignment {
  execution_id: string
  test_case_id: string
  test_case_title: string
  test_case_description: string | null
  story_title: string
  status: string
  assignment_type: string
  test_patient_name: string | null
  test_patient_mrn: string | null
  started_at: string | null
  completed_at: string | null
}

interface TestQueueProps {
  cycleId: string
  assignments: TestAssignment[]
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  assigned: {
    label: "Not Started",
    icon: <Clock className="h-4 w-4" />,
    color: "text-gray-500 bg-gray-100",
  },
  in_progress: {
    label: "In Progress",
    icon: <Play className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-100",
  },
  passed: {
    label: "Passed",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600 bg-green-100",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-600 bg-red-100",
  },
  blocked: {
    label: "Blocked",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-orange-600 bg-orange-100",
  },
  verified: {
    label: "Verified",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-emerald-600 bg-emerald-100",
  },
}

export function TestQueue({ cycleId, assignments }: TestQueueProps) {
  // Group by status for easier navigation
  const pending = assignments.filter((a) => a.status === "assigned" || a.status === "in_progress")
  const completed = assignments.filter((a) => ["passed", "failed", "blocked", "verified"].includes(a.status))

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border">
        <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Assigned</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          You don&apos;t have any tests assigned in this cycle yet. Check back later or contact your UAT Manager.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending Tests */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            Tests to Complete ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((assignment) => (
              <TestCard
                key={assignment.execution_id}
                cycleId={cycleId}
                assignment={assignment}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tests */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-gray-400" />
            Completed Tests ({completed.length})
          </h2>
          <div className="space-y-2">
            {completed.map((assignment) => (
              <TestCard
                key={assignment.execution_id}
                cycleId={cycleId}
                assignment={assignment}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TestCard({
  cycleId,
  assignment,
}: {
  cycleId: string
  assignment: TestAssignment
}) {
  const config = statusConfig[assignment.status] || statusConfig.assigned
  const isClickable = ["assigned", "in_progress"].includes(assignment.status)

  const content = (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border bg-white transition-all",
        isClickable && "hover:border-primary/50 hover:shadow-sm cursor-pointer",
        assignment.status === "in_progress" && "border-blue-200 bg-blue-50/50"
      )}
    >
      {/* Status Icon */}
      <div className={cn("shrink-0 h-10 w-10 rounded-full flex items-center justify-center", config.color)}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-medium text-gray-900 truncate">{assignment.test_case_title}</h3>
          {assignment.assignment_type === "cross_validation" && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
              <Users className="h-3 w-3" />
              Cross-Val
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{assignment.story_title}</p>
        {assignment.test_patient_name && (
          <p className="text-xs text-gray-400 mt-1">
            Patient: {assignment.test_patient_name} (MRN: {assignment.test_patient_mrn})
          </p>
        )}
      </div>

      {/* Status Badge & Arrow */}
      <div className="flex items-center gap-3 shrink-0">
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", config.color)}>
          {config.label}
        </span>
        {isClickable && (
          <ChevronRight className="h-5 w-5 text-gray-300" />
        )}
      </div>
    </div>
  )

  if (isClickable) {
    return (
      <Link href={`/tester/cycle/${cycleId}/test/${assignment.execution_id}`}>
        {content}
      </Link>
    )
  }

  return (
    <Link href={`/tester/cycle/${cycleId}/test/${assignment.execution_id}`}>
      {content}
    </Link>
  )
}
