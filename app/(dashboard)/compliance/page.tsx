import { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, Grid3X3, Library, FileCheck, AlertTriangle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ComplianceSummaryCard,
  ComplianceDashboardStats,
} from "@/components/compliance"
import { getComplianceSummary, getComplianceGaps } from "./actions"

export const metadata: Metadata = {
  title: "Compliance Dashboard",
  description: "Healthcare compliance tracking dashboard",
}

export const dynamic = "force-dynamic"

export default async function ComplianceDashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Check role permissions
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single()

  if (!userData || !["Admin", "Portfolio Manager", "Program Manager"].includes(userData.role || "")) {
    redirect("/dashboard")
  }

  // Fetch compliance data
  const [summaryResult, gapsResult] = await Promise.all([
    getComplianceSummary(),
    getComplianceGaps({ criticalOnly: true }),
  ])

  const stats = summaryResult.success ? summaryResult.data : null
  const criticalGaps = gapsResult.success ? gapsResult.data?.filter(g => g.has_gap) || [] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Compliance Dashboard
          </h1>
          <p className="text-muted-foreground">
            Healthcare regulatory compliance tracking for 21 CFR Part 11, HIPAA, and more
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/compliance/reports">
              <FileCheck className="mr-2 h-4 w-4" />
              Generate Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <ComplianceDashboardStats
          totalMappings={stats.total_mappings}
          storiesWithMappings={stats.total_stories_with_mappings}
          criticalGaps={stats.critical_gaps}
          recentVerifications={stats.recent_verifications}
        />
      )}

      {/* Framework Summary Cards */}
      {stats && stats.frameworks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Framework Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.frameworks.map((framework) => (
              <ComplianceSummaryCard
                key={framework.framework_id}
                summary={framework}
              />
            ))}
          </div>
        </div>
      )}

      {/* Critical Gaps Alert */}
      {criticalGaps.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Critical Compliance Gaps
            </CardTitle>
            <CardDescription className="text-red-600">
              {criticalGaps.length} critical controls require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalGaps.slice(0, 5).map((gap) => (
                <div
                  key={gap.control_id}
                  className="flex items-center justify-between p-2 rounded bg-white/50"
                >
                  <div>
                    <span className="font-mono text-sm font-medium">
                      {gap.control_code}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {gap.control_title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {gap.framework_code}
                  </span>
                </div>
              ))}
              {criticalGaps.length > 5 && (
                <Button variant="ghost" size="sm" asChild className="w-full">
                  <Link href="/compliance/matrix?critical=true">
                    View all {criticalGaps.length} critical gaps
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Grid3X3 className="h-5 w-5" />
              Compliance Matrix
            </CardTitle>
            <CardDescription>
              View all story-to-control mappings in a comprehensive matrix
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/compliance/matrix">
                Open Matrix
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Library className="h-5 w-5" />
              Control Library
            </CardTitle>
            <CardDescription>
              Browse and search compliance controls across all frameworks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/compliance/controls">
                Browse Controls
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="h-5 w-5" />
              Audit Reports
            </CardTitle>
            <CardDescription>
              Generate reports for compliance audits and certifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/compliance/reports">
                Generate Reports
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {(!stats || stats.frameworks.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Compliance Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by browsing the control library and mapping controls to your user stories.
            </p>
            <Button asChild>
              <Link href="/compliance/controls">
                Browse Control Library
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
