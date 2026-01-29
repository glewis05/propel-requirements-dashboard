"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { TEST_CASE_STATUS_CONFIG } from "@/lib/uat/execution-transitions"
import type { TestCaseStatus, TestStep } from "@/types/database"
import { FileText, Sparkles, CheckCircle, Clock } from "lucide-react"

interface TestCaseCardProps {
  testCase: {
    test_case_id: string
    title: string
    description: string | null
    test_steps: TestStep[]
    test_type: string
    priority: string
    status: TestCaseStatus
    is_ai_generated: boolean
    human_reviewed: boolean
    created_at: string
  }
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
}

export function TestCaseCard({ testCase }: TestCaseCardProps) {
  const statusConfig = TEST_CASE_STATUS_CONFIG[testCase.status]
  const steps = Array.isArray(testCase.test_steps) ? testCase.test_steps : []

  return (
    <Link
      href={`/uat/test-cases/${testCase.test_case_id}`}
      className="block rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <h3 className="font-medium text-sm truncate">{testCase.title}</h3>
          </div>
          {testCase.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {testCase.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border", statusConfig.color)}>
            {statusConfig.label}
          </span>
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", priorityColors[testCase.priority] || "bg-gray-100 text-gray-800")}>
            {testCase.priority}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {steps.length} steps
        </span>
        <span className="capitalize">{testCase.test_type}</span>
        {testCase.is_ai_generated && (
          <span className="inline-flex items-center gap-1 text-violet-600">
            <Sparkles className="h-3 w-3" />
            AI Generated
          </span>
        )}
        {testCase.human_reviewed && (
          <span className="inline-flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            Reviewed
          </span>
        )}
      </div>
    </Link>
  )
}
