"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/database"
import {
  FileText,
  Play,
  Bug,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react"

interface UATStats {
  totalTestCases: number
  totalExecutions: number
  passedCount: number
  failedCount: number
  blockedCount: number
  pendingCount: number
  verifiedCount: number
  openDefects: number
  criticalDefects: number
}

interface TesterWorkload {
  userId: string
  name: string
  totalAssigned: number
  notStarted: number
  inProgress: number
  passed: number
  failed: number
  blocked: number
}

interface StoryProgress {
  storyId: string
  storyTitle: string
  totalTests: number
  completedTests: number
  passRate: number
  openDefects: number
}

interface UATDashboardProps {
  stats: UATStats
  testerWorkloads: TesterWorkload[]
  storyProgress: StoryProgress[]
  userRole: UserRole | null
}

export function UATDashboard({ stats, testerWorkloads, storyProgress, userRole }: UATDashboardProps) {
  const isManager = userRole && ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(userRole)

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          label="Test Cases"
          value={stats.totalTestCases}
          href="/uat/test-cases"
        />
        <StatCard
          icon={<Play className="h-5 w-5 text-yellow-600" />}
          label="Executions"
          value={stats.totalExecutions}
          subtext={`${stats.pendingCount} pending`}
          href="/uat/executions"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          label="Pass Rate"
          value={stats.totalExecutions > 0
            ? `${Math.round((stats.passedCount / stats.totalExecutions) * 100)}%`
            : "N/A"
          }
          subtext={`${stats.passedCount} passed, ${stats.verifiedCount} verified`}
        />
        <StatCard
          icon={<Bug className="h-5 w-5 text-red-600" />}
          label="Open Defects"
          value={stats.openDefects}
          subtext={stats.criticalDefects > 0 ? `${stats.criticalDefects} critical` : undefined}
          href="/uat/defects"
          variant={stats.criticalDefects > 0 ? "danger" : "default"}
        />
      </div>

      {/* Execution Status Breakdown */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-medium mb-3">Execution Status</h3>
        <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden bg-muted">
          {stats.totalExecutions > 0 ? (
            <>
              {stats.verifiedCount > 0 && (
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(stats.verifiedCount / stats.totalExecutions) * 100}%` }}
                  title={`Verified: ${stats.verifiedCount}`}
                />
              )}
              {stats.passedCount > 0 && (
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(stats.passedCount / stats.totalExecutions) * 100}%` }}
                  title={`Passed: ${stats.passedCount}`}
                />
              )}
              {stats.failedCount > 0 && (
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(stats.failedCount / stats.totalExecutions) * 100}%` }}
                  title={`Failed: ${stats.failedCount}`}
                />
              )}
              {stats.blockedCount > 0 && (
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${(stats.blockedCount / stats.totalExecutions) * 100}%` }}
                  title={`Blocked: ${stats.blockedCount}`}
                />
              )}
              {stats.pendingCount > 0 && (
                <div
                  className="h-full bg-blue-300"
                  style={{ width: `${(stats.pendingCount / stats.totalExecutions) * 100}%` }}
                  title={`Pending: ${stats.pendingCount}`}
                />
              )}
            </>
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Verified ({stats.verifiedCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Passed ({stats.passedCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Failed ({stats.failedCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> Blocked ({stats.blockedCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-300" /> Pending ({stats.pendingCount})
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stories in UAT */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-medium">Stories in UAT</h3>
            <Link href="/stories?status=In+UAT" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {storyProgress.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No stories currently in UAT
              </div>
            ) : (
              storyProgress.map(story => (
                <div key={story.storyId} className="p-3">
                  <div className="flex items-center justify-between">
                    <Link href={`/stories/${story.storyId}`} className="text-sm font-medium hover:text-primary truncate">
                      {story.storyTitle}
                    </Link>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                      {story.completedTests}/{story.totalTests}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          story.passRate >= 80 ? "bg-green-500" : story.passRate >= 50 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${story.totalTests > 0 ? (story.completedTests / story.totalTests) * 100 : 0}%` }}
                      />
                    </div>
                    {story.openDefects > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-red-600">
                        <Bug className="h-3 w-3" />
                        {story.openDefects}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tester Workload (Manager view) or My Tests (Tester view) */}
        {isManager ? (
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-medium">Tester Workload</h3>
              <Link href="/uat/executions" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {testerWorkloads.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No testers assigned yet
                </div>
              ) : (
                testerWorkloads.map(tester => (
                  <div key={tester.userId} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{tester.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {tester.totalAssigned} assigned
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      {tester.notStarted > 0 && (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <Clock className="h-3 w-3" />
                          {tester.notStarted}
                        </span>
                      )}
                      {tester.inProgress > 0 && (
                        <span className="inline-flex items-center gap-1 text-yellow-600">
                          <Play className="h-3 w-3" />
                          {tester.inProgress}
                        </span>
                      )}
                      {tester.passed > 0 && (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {tester.passed}
                        </span>
                      )}
                      {tester.failed > 0 && (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          {tester.failed}
                        </span>
                      )}
                      {tester.blocked > 0 && (
                        <span className="inline-flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="h-3 w-3" />
                          {tester.blocked}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-medium">My Assigned Tests</h3>
              <Link href="/uat/executions/my" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>Go to My Tests to see and execute your assigned tests</p>
              <Link
                href="/uat/executions/my"
                className="inline-flex items-center gap-2 mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Play className="h-4 w-4" />
                My Tests
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {isManager && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/uat/test-cases/new"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <FileText className="h-4 w-4" />
              New Test Case
            </Link>
            <Link
              href="/uat/defects/new"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <Bug className="h-4 w-4" />
              Report Defect
            </Link>
            <Link
              href="/uat/executions"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <Users className="h-4 w-4" />
              Manage Executions
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Stat Card Sub-component
// ============================================================================

function StatCard({
  icon,
  label,
  value,
  subtext,
  href,
  variant = "default",
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  href?: string
  variant?: "default" | "danger"
}) {
  const content = (
    <div className={cn(
      "rounded-lg border bg-card p-4",
      href && "hover:border-primary/50 transition-colors cursor-pointer",
      variant === "danger" && "border-red-200"
    )}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {subtext && (
            <p className={cn("text-xs mt-0.5", variant === "danger" ? "text-red-600" : "text-muted-foreground")}>
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
