"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Search, AlertTriangle, ExternalLink } from "lucide-react"
import { ComplianceBadge } from "./compliance-badge"
import { ComplianceStatusBadge } from "./compliance-status-badge"
import { COMPLIANCE_STATUS_CONFIG, FRAMEWORK_CONFIG } from "@/lib/compliance/constants"
import type { ComplianceMatrixCell, ComplianceStatus } from "@/types/compliance"

interface ComplianceMatrixGridProps {
  data: ComplianceMatrixCell[]
  programs?: { program_id: string; name: string }[]
  frameworks?: { framework_id: string; code: string; name: string }[]
}

export function ComplianceMatrixGrid({
  data,
  programs = [],
  frameworks = [],
}: ComplianceMatrixGridProps) {
  const [search, setSearch] = useState("")
  const [programFilter, setProgramFilter] = useState<string>("all")
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredData = useMemo(() => {
    return data.filter((cell) => {
      // Search filter
      if (search) {
        const query = search.toLowerCase()
        const matches =
          cell.story_id.toLowerCase().includes(query) ||
          cell.story_title.toLowerCase().includes(query) ||
          cell.control_code.toLowerCase().includes(query) ||
          cell.control_title.toLowerCase().includes(query)
        if (!matches) return false
      }

      // Program filter
      if (programFilter !== "all" && cell.program_id !== programFilter) {
        return false
      }

      // Framework filter
      if (frameworkFilter !== "all" && cell.framework_code !== frameworkFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== "all" && cell.compliance_status !== statusFilter) {
        return false
      }

      return true
    })
  }, [data, search, programFilter, frameworkFilter, statusFilter])

  // Group by story for better visualization
  const groupedByStory = useMemo(() => {
    const groups = new Map<string, ComplianceMatrixCell[]>()
    filteredData.forEach((cell) => {
      const existing = groups.get(cell.story_id) || []
      existing.push(cell)
      groups.set(cell.story_id, existing)
    })
    return groups
  }, [filteredData])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories or controls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.program_id} value={p.program_id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Frameworks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            {frameworks.map((fw) => (
              <SelectItem key={fw.framework_id} value={fw.code}>
                {fw.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(COMPLIANCE_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredData.length} mappings across {groupedByStory.size} stories
      </div>

      {/* Matrix Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Story</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Framework</TableHead>
              <TableHead>Control</TableHead>
              <TableHead className="w-[100px]">Critical</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[120px]">Target Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No compliance mappings found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((cell) => (
                <TableRow key={`${cell.story_id}-${cell.control_id}`}>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/stories/${cell.story_id}`}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            <span className="truncate max-w-[150px]">
                              {cell.story_id}
                            </span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{cell.story_title}</p>
                          <p className="text-xs text-muted-foreground">
                            Status: {cell.story_status}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{cell.program_name || cell.program_id}</span>
                  </TableCell>
                  <TableCell>
                    <ComplianceBadge frameworkCode={cell.framework_code} size="sm" />
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-mono text-sm cursor-help">
                            {cell.control_code}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{cell.control_title}</p>
                          {cell.control_category && (
                            <p className="text-xs text-muted-foreground">
                              {cell.control_category}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {cell.is_critical && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Critical
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {cell.compliance_status && (
                      <ComplianceStatusBadge
                        status={cell.compliance_status}
                        size="sm"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {cell.target_date && (
                      <span className="text-sm text-muted-foreground">
                        {new Date(cell.target_date).toLocaleDateString()}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
