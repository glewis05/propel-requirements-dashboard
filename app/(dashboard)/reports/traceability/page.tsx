"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Download, RefreshCw, GitBranch, Filter, ExternalLink } from "lucide-react"
import { getTraceabilityMatrix, type TraceabilityItem } from "../actions"
import { createClient } from "@/lib/supabase/client"

export default function TraceabilityPage() {
  const [data, setData] = useState<TraceabilityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [programs, setPrograms] = useState<Array<{ program_id: string; name: string }>>([])
  const [selectedProgram, setSelectedProgram] = useState<string>("")
  const [coverageFilter, setCoverageFilter] = useState<string>("")

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
    const result = await getTraceabilityMatrix(selectedProgram || undefined)
    if (result.success && result.data) {
      setData(result.data)
    } else {
      setError(result.error || "Failed to load report")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPrograms()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedProgram])

  const filteredData = coverageFilter
    ? data.filter(item => item.coverage_status === coverageFilter)
    : data

  const exportToCsv = () => {
    if (filteredData.length === 0) return

    const headers = [
      "Requirement ID",
      "DIS Number",
      "Requirement Title",
      "Category",
      "Priority",
      "Requirement Status",
      "Program",
      "Story ID",
      "Story Title",
      "Story Status",
      "Coverage Type",
      "Coverage Status",
      "Coverage Notes"
    ]

    const rows = filteredData.map(item => [
      item.requirement_id,
      item.dis_number || "",
      `"${(item.requirement_title || "").replace(/"/g, '""')}"`,
      item.requirement_category || "",
      item.requirement_priority || "",
      item.requirement_status,
      item.program_name,
      item.story_id || "",
      `"${(item.story_title || "").replace(/"/g, '""')}"`,
      item.story_status || "",
      item.coverage_type || "",
      item.coverage_status,
      `"${(item.coverage_notes || "").replace(/"/g, '""')}"`
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `traceability-matrix-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const coverageStats = {
    total: data.length,
    notCovered: data.filter(d => d.coverage_status === "Not Covered").length,
    mapped: data.filter(d => d.coverage_status === "Mapped").length,
    inProgress: data.filter(d => d.coverage_status === "In Progress").length,
    verified: data.filter(d => d.coverage_status === "Verified").length,
  }

  const getCoverageStatusColor = (status: string) => {
    switch (status) {
      case "Not Covered": return "bg-red-100 text-red-700"
      case "Mapped": return "bg-yellow-100 text-yellow-700"
      case "In Progress": return "bg-blue-100 text-blue-700"
      case "Verified": return "bg-green-100 text-green-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

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
            disabled={filteredData.length === 0}
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
          <GitBranch className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Traceability Matrix</h1>
          <p className="text-sm text-muted-foreground">
            Requirements to user stories mapping with coverage analysis
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
        <select
          value={coverageFilter}
          onChange={(e) => setCoverageFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Coverage Status</option>
          <option value="Not Covered">Not Covered</option>
          <option value="Mapped">Mapped</option>
          <option value="In Progress">In Progress</option>
          <option value="Verified">Verified</option>
        </select>
      </div>

      {/* Coverage Stats */}
      {!loading && !error && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Requirements</p>
            <p className="text-2xl font-bold text-foreground">{coverageStats.total}</p>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">Not Covered</p>
            <p className="text-2xl font-bold text-red-700">{coverageStats.notCovered}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <p className="text-sm text-yellow-600">Mapped</p>
            <p className="text-2xl font-bold text-yellow-700">{coverageStats.mapped}</p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-700">{coverageStats.inProgress}</p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-600">Verified</p>
            <p className="text-2xl font-bold text-green-700">{coverageStats.verified}</p>
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
          <p className="text-muted-foreground">No requirements found. Run migration 005_requirements_traceability.sql and add requirements to see the traceability matrix.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">Requirement</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Story</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Story Status</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Coverage</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={`${item.requirement_uuid}-${item.story_id || index}`} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{item.requirement_id}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{item.requirement_title}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.requirement_category || "-"}</td>
                    <td className="px-4 py-3">
                      {item.story_id ? (
                        <Link href={`/stories/${item.story_id}`} className="flex items-center gap-1 text-primary hover:underline">
                          {item.story_id}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.story_status || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getCoverageStatusColor(item.coverage_status)}`}>
                        {item.coverage_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{item.coverage_type || "-"}</td>
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
