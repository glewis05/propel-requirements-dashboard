"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Download, RefreshCw, FileText, Filter, ExternalLink, Calendar } from "lucide-react"
import { getStatusTransitionsReport, type StatusTransitionReport } from "../actions"
import { createClient } from "@/lib/supabase/client"

export default function ApprovalsPage() {
  const [data, setData] = useState<StatusTransitionReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [programs, setPrograms] = useState<Array<{ program_id: string; name: string }>>([])
  const [selectedProgram, setSelectedProgram] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const fetchPrograms = async () => {
    const supabase = createClient()
    const { data: programsData } = await supabase
      .from("programs")
      .select("program_id, name")
      .eq("status", "Active")
      .order("name")
    if (programsData) {
      setPrograms(programsData)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    const result = await getStatusTransitionsReport(
      startDate || undefined,
      endDate || undefined,
      selectedProgram || undefined
    )
    if (result.success && result.data) {
      setData(result.data)
    } else {
      setError(result.error || "Failed to load report")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPrograms()
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedProgram, startDate, endDate])

  const exportToCsv = () => {
    if (data.length === 0) return

    const headers = [
      "Story ID",
      "Title",
      "Program",
      "From Status",
      "To Status",
      "Changed By",
      "Changed At",
      "Notes"
    ]

    const rows = data.map(item => [
      item.story_id,
      `"${(item.title || "").replace(/"/g, '""')}"`,
      item.program_name,
      item.from_status,
      item.to_status,
      item.changed_by,
      new Date(item.changed_at).toISOString(),
      `"${(item.notes || "").replace(/"/g, '""')}"`
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `approval-history-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-gray-100 text-gray-700"
      case "Internal Review": return "bg-blue-100 text-blue-700"
      case "Pending Client Review": return "bg-yellow-100 text-yellow-700"
      case "Approved": return "bg-green-100 text-green-700"
      case "In Development": return "bg-purple-100 text-purple-700"
      case "In UAT": return "bg-indigo-100 text-indigo-700"
      case "Needs Discussion": return "bg-orange-100 text-orange-700"
      case "Out of Scope": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  // Calculate summary stats
  const uniqueStories = new Set(data.map(d => d.story_id)).size
  const uniqueUsers = new Set(data.map(d => d.changed_by)).size
  const approvalsToApproved = data.filter(d => d.to_status === "Approved").length

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
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approval History Report</h1>
          <p className="text-sm text-muted-foreground">
            Complete audit trail of all status changes and approvals
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">All Programs</option>
            {programs.map(p => (
              <option key={p.program_id} value={p.program_id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            placeholder="Start date"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            placeholder="End date"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(""); setEndDate("") }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Summary Stats */}
      {!loading && !error && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Transitions</p>
            <p className="text-2xl font-bold text-foreground">{data.length}</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-sm text-muted-foreground">Unique Stories</p>
            <p className="text-2xl font-bold text-foreground">{uniqueStories}</p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-600">Approved</p>
            <p className="text-2xl font-bold text-green-700">{approvalsToApproved}</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-sm text-muted-foreground">Unique Approvers</p>
            <p className="text-2xl font-bold text-foreground">{uniqueUsers}</p>
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
          <p className="text-muted-foreground">No approval records found for the selected criteria.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">Date/Time</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Story</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Program</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">From</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">To</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Changed By</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={`${item.story_id}-${item.changed_at}-${index}`} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(item.changed_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/stories/${item.story_id}`} className="flex items-center gap-1 text-primary hover:underline">
                        {item.story_id}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{item.title}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.program_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.from_status)}`}>
                        {item.from_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.to_status)}`}>
                        {item.to_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{item.changed_by}</td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">
                      {item.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FDA Compliance Note */}
      <div className="rounded-lg bg-muted/50 border border-border p-4">
        <p className="text-sm text-muted-foreground">
          <strong>FDA 21 CFR Part 11 Compliance:</strong> This report provides an immutable audit trail of all status changes and approvals.
          Each record includes timestamp, user identification, and change details for regulatory compliance.
        </p>
      </div>
    </div>
  )
}
