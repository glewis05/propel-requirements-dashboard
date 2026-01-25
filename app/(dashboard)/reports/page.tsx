import { FileText, Download, BarChart3, GitBranch } from "lucide-react"

export default function ReportsPage() {
  const reports = [
    {
      name: "Traceability Matrix",
      description: "Requirements to test cases mapping with coverage analysis",
      icon: GitBranch,
      available: true,
    },
    {
      name: "Program Summary",
      description: "Overview of all stories by program with status breakdown",
      icon: BarChart3,
      available: true,
    },
    {
      name: "Approval History",
      description: "Complete audit trail of all approvals and status changes",
      icon: FileText,
      available: true,
    },
    {
      name: "Coverage Gap Analysis",
      description: "Identify requirements without linked test cases",
      icon: BarChart3,
      available: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Generate and export compliance reports
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
                    <>
                      <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                        Generate
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                        <Download className="h-4 w-4" />
                        Export PDF
                      </button>
                    </>
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
    </div>
  )
}
