"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { FRAMEWORK_CONFIG } from "@/lib/compliance/constants"
import type { ComplianceFrameworkSummary } from "@/types/compliance"
import { ComplianceBadge } from "./compliance-badge"
import { ComplianceProgressBar } from "./compliance-status-badge"
import { Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

interface ComplianceSummaryCardProps {
  summary: ComplianceFrameworkSummary
  onClick?: () => void
  className?: string
}

export function ComplianceSummaryCard({
  summary,
  onClick,
  className,
}: ComplianceSummaryCardProps) {
  const config = FRAMEWORK_CONFIG[summary.framework_code]

  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ComplianceBadge
              frameworkCode={summary.framework_code}
              size="md"
              showLabel
            />
          </CardTitle>
          <span className="text-2xl font-bold">
            {summary.completion_percentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ComplianceProgressBar
          verified={summary.verified_count}
          implemented={summary.implemented_count}
          inProgress={summary.in_progress_count}
          total={summary.total_controls}
          className="mb-4"
        />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>{summary.total_controls} controls</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>{summary.critical_controls} critical</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>{summary.verified_count} verified</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span>{summary.in_progress_count} in progress</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ComplianceDashboardStatsProps {
  totalMappings: number
  storiesWithMappings: number
  criticalGaps: number
  recentVerifications: number
  className?: string
}

export function ComplianceDashboardStats({
  totalMappings,
  storiesWithMappings,
  criticalGaps,
  recentVerifications,
  className,
}: ComplianceDashboardStatsProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-4", className)}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Mappings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMappings}</div>
          <p className="text-xs text-muted-foreground">
            Across all frameworks
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Stories Covered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{storiesWithMappings}</div>
          <p className="text-xs text-muted-foreground">
            With compliance mappings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Critical Gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold",
            criticalGaps > 0 ? "text-red-600" : "text-green-600"
          )}>
            {criticalGaps}
          </div>
          <p className="text-xs text-muted-foreground">
            Require attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Verifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{recentVerifications}</div>
          <p className="text-xs text-muted-foreground">
            Last 7 days
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
