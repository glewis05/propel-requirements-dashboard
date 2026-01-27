"use client"

import { FileText, BarChart3, GitBranch, ClipboardList, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  const reports = [
    {
      name: "Program Summary",
      description: "Overview of all stories by program with status and priority breakdown",
      icon: BarChart3,
      href: "/reports/program-summary",
      available: true,
    },
    {
      name: "Traceability Matrix",
      description: "Requirements to user stories mapping with coverage analysis",
      icon: GitBranch,
      href: "/reports/traceability",
      available: true,
    },
    {
      name: "Requirement Coverage",
      description: "Coverage metrics showing which requirements have linked stories",
      icon: ClipboardList,
      href: "/reports/coverage",
      available: true,
    },
    {
      name: "Approval History",
      description: "Complete audit trail of all approvals and status changes",
      icon: FileText,
      href: "/reports/approvals",
      available: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Generate and export compliance reports for traceability and auditing
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div
            key={report.name}
            className={`rounded-lg bg-card shadow-sm border border-border p-6 ${
              !report.available ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <report.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {report.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.description}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  {report.available ? (
                    <Link
                      href={report.href}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      View Report
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="rounded-lg bg-muted/50 border border-border p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Reports are generated in real-time from your current data.
          Export options (PDF, Excel, CSV) are available on each report page.
        </p>
      </div>
    </div>
  )
}
