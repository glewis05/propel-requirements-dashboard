"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileCheck, Download, FileText, AlertTriangle, Package, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { REPORT_TYPES } from "@/lib/compliance/constants"
import { exportComplianceCSV } from "../actions"

const reportIcons = {
  summary: BarChart3,
  detail: FileText,
  gap_analysis: AlertTriangle,
  audit_package: Package,
}

export default function ComplianceReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>("summary")
  const [selectedFramework, setSelectedFramework] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (exportType: "matrix" | "gaps" | "history" | "summary") => {
    setLoading(true)
    setError(null)

    try {
      const result = await exportComplianceCSV(exportType, {
        frameworkCode: selectedFramework !== "all" ? selectedFramework : undefined,
      })

      if (result.success && result.data) {
        // Create and download the CSV file
        const blob = new Blob([result.data], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `compliance-${exportType}-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        setError(result.error || "Failed to generate report")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/compliance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-6 w-6" />
            Audit Reports
          </h1>
          <p className="text-muted-foreground">
            Generate compliance reports for audits and certifications
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Options</CardTitle>
          <CardDescription>
            Configure the report parameters before generating
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Framework Filter</Label>
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger>
                  <SelectValue placeholder="All Frameworks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  <SelectItem value="CFR11">21 CFR Part 11</SelectItem>
                  <SelectItem value="HIPAA">HIPAA Security Rule</SelectItem>
                  <SelectItem value="HITRUST">HITRUST CSF</SelectItem>
                  <SelectItem value="SOC2">SOC 2 Type II</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Summary Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Compliance Summary
            </CardTitle>
            <CardDescription>
              High-level overview of compliance status across all frameworks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleExport("summary")}
              disabled={loading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Export Summary CSV"}
            </Button>
          </CardContent>
        </Card>

        {/* Matrix Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compliance Matrix
            </CardTitle>
            <CardDescription>
              Complete mapping of stories to compliance controls with status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleExport("matrix")}
              disabled={loading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Export Matrix CSV"}
            </Button>
          </CardContent>
        </Card>

        {/* Gap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Gap Analysis
            </CardTitle>
            <CardDescription>
              Controls that need implementation or verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleExport("gaps")}
              disabled={loading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Export Gap Analysis CSV"}
            </Button>
          </CardContent>
        </Card>

        {/* Audit History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Complete history of compliance mapping changes for FDA Part 11 compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleExport("history")}
              disabled={loading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Export Audit Trail CSV"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Compliance Reports</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            These reports are designed to support healthcare regulatory audits and certifications:
          </p>
          <ul>
            <li>
              <strong>Compliance Summary</strong> - Quick overview for management review, showing
              completion percentages and control counts by framework.
            </li>
            <li>
              <strong>Compliance Matrix</strong> - Detailed mapping showing which user stories
              implement each compliance control, with current status and target dates.
            </li>
            <li>
              <strong>Gap Analysis</strong> - Identifies controls that have not been implemented
              or verified, with priority given to critical controls.
            </li>
            <li>
              <strong>Audit Trail</strong> - FDA 21 CFR Part 11 compliant history showing all
              changes to compliance mappings with timestamps, users, and IP addresses.
            </li>
          </ul>
          <p className="text-muted-foreground">
            PDF reports with branded templates will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
