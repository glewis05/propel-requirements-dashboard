"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Download, RefreshCw, BarChart3 } from "lucide-react"
import { getProgramSummaryReport, type ProgramSummary } from "../actions"

export default function ProgramSummaryPage() {
  const [data, setData] = useState<ProgramSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    const result = await getProgramSummaryReport()
    if (result.success && result.data) {
      setData(result.data)
    } else {
      setError(result.error || "Failed to load report")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const exportToCsv = () => {
    if (data.length === 0) return

    const headers = [
      "Program",
      "Total Stories",
      "Draft",
      "Internal Review",
      "Pending Client Review",
      "Approved",
      "In Development",
      "In UAT",
      "Needs Discussion",
      "Out of Scope",
      "Must Have",
      "Should Have",
      "Could Have",
      "Would Have",
      "Approval Rate %"
    ]

    const rows = data.map(p => [
      p.program_name,
      p.total_stories,
      p.by_status["Draft"],
      p.by_status["Internal Review"],
      p.by_status["Pending Client Review"],
      p.by_status["Approved"],
      p.by_status["In Development"],
      p.by_status["In UAT"],
      p.by_status["Needs Discussion"],
      p.by_status["Out of Scope"],
      p.by_priority["Must Have"],
      p.by_priority["Should Have"],
      p.by_priority["Could Have"],
      p.by_priority["Would Have"],
      p.approval_rate
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `program-summary-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const totalStories = data.reduce((sum, p) => sum + p.total_stories, 0)
  const totalApproved = data.reduce((sum, p) => sum + p.approved_count, 0)
  const overallApprovalRate = totalStories > 0 ? Math.round((totalApproved / totalStories) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportToCsv}
            disabled={data.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Program Summary Report</h1>
          <p className="text-sm text-muted-foreground">
            Overview of stories by program with status and priority breakdown
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && !error && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Programs</p>
            <p className="text-2xl font-bold text-foreground">{data.length}</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Stories</p>
            <p className="text-2xl font-bold text-foreground">{totalStories}</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-sm text-muted-foreground">Client Approved</p>
            <p className="text-2xl font-bold text-foreground">{totalApproved}</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-sm text-muted-foreground">Overall Approval Rate</p>
            <p className="text-2xl font-bold text-foreground">{overallApprovalRate}%</p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-lg bg-muted/50 border border-border p-8 text-center">
          <p className="text-muted-foreground">No programs found with stories.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">Program</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">Total</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">Draft</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">Internal</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">Client Rev</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">Approved</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">In Dev</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">UAT</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">Approval %</th>
                </tr>
              </thead>
              <tbody>
                {data.map((program) => (
                  <tr key={program.program_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{program.program_name}</td>
                    <td className="px-4 py-3 text-right text-foreground">{program.total_stories}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{program.by_status["Draft"]}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{program.by_status["Internal Review"]}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{program.by_status["Pending Client Review"]}</td>
                    <td className="px-4 py-3 text-right text-green-600">{program.by_status["Approved"]}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{program.by_status["In Development"]}</td>
                    <td className="px-4 py-3 text-right text-purple-600">{program.by_status["In UAT"]}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{program.approval_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Priority Breakdown */}
      {!loading && !error && data.length > 0 && (
        <div className="rounded-lg bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <h2 className="font-medium text-foreground">Priority Breakdown by Program</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-foreground">Program</th>
                  <th className="px-4 py-3 text-right font-medium text-red-600">Must Have</th>
                  <th className="px-4 py-3 text-right font-medium text-orange-600">Should Have</th>
                  <th className="px-4 py-3 text-right font-medium text-yellow-600">Could Have</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Would Have</th>
                </tr>
              </thead>
              <tbody>
                {data.map((program) => (
                  <tr key={program.program_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{program.program_name}</td>
                    <td className="px-4 py-3 text-right text-red-600">{program.by_priority["Must Have"] || 0}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{program.by_priority["Should Have"] || 0}</td>
                    <td className="px-4 py-3 text-right text-yellow-600">{program.by_priority["Could Have"] || 0}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{program.by_priority["Would Have"] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
