"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Download, RefreshCw, ClipboardList, Filter, ExternalLink, AlertTriangle } from "lucide-react"
import { getRequirementCoverageReport, getStoryCoverageReport, type RequirementCoverageSummary, type StoryCoverageItem } from "../actions"
import { createClient } from "@/lib/supabase/client"

export default function CoveragePage() {
  const [coverageSummary, setCoverageSummary] = useState<RequirementCoverageSummary[]>([])
  const [storyCoverage, setStoryCoverage] = useState<StoryCoverageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [programs, setPrograms] = useState<Array<{ program_id: string; name: string }>>([])
  const [selectedProgram, setSelectedProgram] = useState<string>("")
  const [viewMode, setViewMode] = useState<"requirements" | "stories">("requirements")
  const [showOnlyUncovered, setShowOnlyUncovered] = useState(false)

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

    const [coverageResult, storyResult] = await Promise.all([
      getRequirementCoverageReport(),
      getStoryCoverageReport(selectedProgram || undefined)
    ])

    if (coverageResult.success && coverageResult.data) {
      setCoverageSummary(coverageResult.data)
    }
    if (storyResult.success && storyResult.data) {
      setStoryCoverage(storyResult.data)
    }
    if (!coverageResult.success) {
      setError(coverageResult.error || "Failed to load coverage report")
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchPrograms()
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedProgram])

  const filteredSummary = selectedProgram
    ? coverageSummary.filter(s => s.program_id === selectedProgram)
    : coverageSummary

  const filteredStories = showOnlyUncovered
    ? storyCoverage.filter(s => !s.has_requirement)
    : storyCoverage

  const exportRequirementsCsv = () => {
    if (filteredSummary.length === 0) return

    const headers = [
      "Program",
      "Total Requirements",
      "Covered",
      "Uncovered",
      "Uncovered Critical",
      "Coverage %"
    ]

    const rows = filteredSummary.map(item => [
      item.program_name,
      item.total_requirements,
      item.covered_requirements,
      item.uncovered_requirements,
      item.uncovered_critical,
      item.coverage_percentage
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `requirement-coverage-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const exportStoriesCsv = () => {
    if (filteredStories.length === 0) return

    const headers = [
      "Story ID",
      "Title",
      "Program",
      "Status",
      "Priority",
      "Has Requirement",
      "Linked Requirement"
    ]

    const rows = filteredStories.map(item => [
      item.story_id,
      `"${(item.title || "").replace(/"/g, '""')}"`,
      item.program_name,
      item.status,
      item.priority || "",
      item.has_requirement ? "Yes" : "No",
      item.linked_requirement_id || ""
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `story-coverage-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const totalRequirements = filteredSummary.reduce((sum, s) => sum + s.total_requirements, 0)
  const totalCovered = filteredSummary.reduce((sum, s) => sum + s.covered_requirements, 0)
  const totalUncoveredCritical = filteredSummary.reduce((sum, s) => sum + s.uncovered_critical, 0)
  const overallCoverage = totalRequirements > 0 ? Math.round((totalCovered / totalRequirements) * 100) : 0

  const storiesWithReq = storyCoverage.filter(s => s.has_requirement).length
  const storiesWithoutReq = storyCoverage.filter(s => !s.has_requirement).length

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
            onClick={viewMode === "requirements" ? exportRequirementsCsv : exportStoriesCsv}
            disabled={(viewMode === "requirements" ? filteredSummary.length : filteredStories.length) === 0}
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
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coverage Report</h1>
          <p className="text-sm text-muted-foreground">
            Analyze requirement coverage and story traceability
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-4">
        <div className="inline-flex rounded-md border border-input overflow-hidden">
          <button
            onClick={() => setViewMode("requirements")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "requirements"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted"
            }`}
          >
            Requirements Coverage
          </button>
          <button
            onClick={() => setViewMode("stories")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "stories"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted"
            }`}
          >
            Story Coverage
          </button>
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
        {viewMode === "stories" && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyUncovered}
              onChange={(e) => setShowOnlyUncovered(e.target.checked)}
              className="rounded border-input"
            />
            Show only stories without requirements
          </label>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive">
          {error}
        </div>
      ) : viewMode === "requirements" ? (
        <>
          {/* Requirements Coverage Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-card border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Requirements</p>
              <p className="text-2xl font-bold text-foreground">{totalRequirements}</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-600">Covered</p>
              <p className="text-2xl font-bold text-green-700">{totalCovered}</p>
            </div>
            <div className="rounded-lg bg-card border border-border p-4">
              <p className="text-sm text-muted-foreground">Overall Coverage</p>
              <p className="text-2xl font-bold text-foreground">{overallCoverage}%</p>
            </div>
            {totalUncoveredCritical > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">Uncovered Critical</p>
                </div>
                <p className="text-2xl font-bold text-red-700">{totalUncoveredCritical}</p>
              </div>
            )}
          </div>

          {filteredSummary.length === 0 ? (
            <div className="rounded-lg bg-muted/50 border border-border p-8 text-center">
              <p className="text-muted-foreground">No requirements found. Run migration 005_requirements_traceability.sql and add requirements to see coverage.</p>
            </div>
          ) : (
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-foreground">Program</th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">Total</th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">Covered</th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">Uncovered</th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">Critical Uncovered</th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">Coverage %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummary.map((item) => (
                      <tr key={item.program_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{item.program_name}</td>
                        <td className="px-4 py-3 text-right text-foreground">{item.total_requirements}</td>
                        <td className="px-4 py-3 text-right text-green-600">{item.covered_requirements}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{item.uncovered_requirements}</td>
                        <td className="px-4 py-3 text-right">
                          {item.uncovered_critical > 0 ? (
                            <span className="text-red-600 font-medium">{item.uncovered_critical}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${
                            item.coverage_percentage >= 80 ? "text-green-600" :
                            item.coverage_percentage >= 50 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {item.coverage_percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Story Coverage Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-card border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Stories</p>
              <p className="text-2xl font-bold text-foreground">{storyCoverage.length}</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-600">With Requirements</p>
              <p className="text-2xl font-bold text-green-700">{storiesWithReq}</p>
            </div>
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-600">Without Requirements</p>
              <p className="text-2xl font-bold text-yellow-700">{storiesWithoutReq}</p>
            </div>
          </div>

          {filteredStories.length === 0 ? (
            <div className="rounded-lg bg-muted/50 border border-border p-8 text-center">
              <p className="text-muted-foreground">No stories found matching the filter.</p>
            </div>
          ) : (
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-foreground">Story ID</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Title</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Program</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Has Requirement</th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">Linked Req</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStories.map((item) => (
                      <tr key={item.story_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link href={`/stories/${item.story_id}`} className="flex items-center gap-1 text-primary hover:underline">
                            {item.story_id}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-foreground truncate max-w-xs">{item.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.program_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.status}</td>
                        <td className="px-4 py-3">
                          {item.has_requirement ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Yes</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.linked_requirement_id || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
            </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
