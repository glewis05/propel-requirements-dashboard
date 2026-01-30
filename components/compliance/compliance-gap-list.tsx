"use client"

import { useState, useMemo } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { ComplianceBadge } from "./compliance-badge"
import { REQUIREMENT_LEVEL_CONFIG, FRAMEWORK_CONFIG } from "@/lib/compliance/constants"
import type { ComplianceGapItem } from "@/types/compliance"

interface ComplianceGapListProps {
  gaps: ComplianceGapItem[]
  showAllControls?: boolean
}

export function ComplianceGapList({
  gaps,
  showAllControls = false,
}: ComplianceGapListProps) {
  const [search, setSearch] = useState("")
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all")
  const [showCriticalOnly, setShowCriticalOnly] = useState(false)
  const [showGapsOnly, setShowGapsOnly] = useState(!showAllControls)

  const filteredGaps = useMemo(() => {
    return gaps.filter((gap) => {
      // Search filter
      if (search) {
        const query = search.toLowerCase()
        const matches =
          gap.control_code.toLowerCase().includes(query) ||
          gap.control_title.toLowerCase().includes(query) ||
          gap.category?.toLowerCase().includes(query)
        if (!matches) return false
      }

      // Framework filter
      if (frameworkFilter !== "all" && gap.framework_code !== frameworkFilter) {
        return false
      }

      // Critical filter
      if (showCriticalOnly && !gap.is_critical) {
        return false
      }

      // Gaps only filter
      if (showGapsOnly && !gap.has_gap) {
        return false
      }

      return true
    })
  }, [gaps, search, frameworkFilter, showCriticalOnly, showGapsOnly])

  // Group by framework
  const groupedByFramework = useMemo(() => {
    const groups = new Map<string, ComplianceGapItem[]>()
    filteredGaps.forEach((gap) => {
      const key = gap.framework_code
      const existing = groups.get(key) || []
      existing.push(gap)
      groups.set(key, existing)
    })
    return groups
  }, [filteredGaps])

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredGaps.length
    const withGaps = filteredGaps.filter((g) => g.has_gap).length
    const critical = filteredGaps.filter((g) => g.is_critical).length
    const criticalGaps = filteredGaps.filter((g) => g.is_critical && g.has_gap).length
    return { total, withGaps, critical, criticalGaps }
  }, [filteredGaps])

  const frameworks = useMemo(() => {
    const unique = new Set(gaps.map((g) => g.framework_code))
    return Array.from(unique).map((code) => ({
      code,
      name: FRAMEWORK_CONFIG[code]?.name || code,
    }))
  }, [gaps])

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.withGaps > 0 && "text-amber-600")}>
              {stats.withGaps}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.criticalGaps > 0 && "text-red-600")}>
              {stats.criticalGaps}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search controls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Frameworks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            {frameworks.map((fw) => (
              <SelectItem key={fw.code} value={fw.code}>
                {fw.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showCriticalOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCriticalOnly(!showCriticalOnly)}
        >
          <AlertTriangle className="mr-1 h-4 w-4" />
          Critical Only
        </Button>

        <Button
          variant={showGapsOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowGapsOnly(!showGapsOnly)}
        >
          <XCircle className="mr-1 h-4 w-4" />
          Gaps Only
        </Button>
      </div>

      {/* Gap List by Framework */}
      <Accordion type="multiple" defaultValue={Array.from(groupedByFramework.keys())}>
        {Array.from(groupedByFramework.entries()).map(([frameworkCode, items]) => {
          const frameworkGaps = items.filter((i) => i.has_gap).length
          const frameworkCriticalGaps = items.filter((i) => i.is_critical && i.has_gap).length

          return (
            <AccordionItem key={frameworkCode} value={frameworkCode}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <ComplianceBadge frameworkCode={frameworkCode} size="md" showLabel />
                  <span className="text-sm text-muted-foreground">
                    {items.length} controls
                  </span>
                  {frameworkGaps > 0 && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      {frameworkGaps} gaps
                    </Badge>
                  )}
                  {frameworkCriticalGaps > 0 && (
                    <Badge variant="destructive">
                      {frameworkCriticalGaps} critical
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {items.map((gap) => (
                    <div
                      key={gap.control_id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border",
                        gap.has_gap
                          ? gap.is_critical
                            ? "border-red-200 bg-red-50"
                            : "border-amber-200 bg-amber-50"
                          : "border-green-200 bg-green-50"
                      )}
                    >
                      <div className="mt-0.5">
                        {gap.has_gap ? (
                          <XCircle className={cn(
                            "h-5 w-5",
                            gap.is_critical ? "text-red-500" : "text-amber-500"
                          )} />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-medium">
                            {gap.control_code}
                          </span>
                          {gap.is_critical && (
                            <Badge variant="destructive" className="text-xs">
                              Critical
                            </Badge>
                          )}
                          {gap.requirement_type && (
                            <Badge variant="outline" className="text-xs">
                              {REQUIREMENT_LEVEL_CONFIG[gap.requirement_type]?.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1">{gap.control_title}</p>
                        {gap.category && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {gap.category}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{gap.stories_count} stories</span>
                          <span>{gap.implemented_count} implemented</span>
                          <span>{gap.verified_count} verified</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {filteredGaps.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No controls found matching your filters
        </div>
      )}
    </div>
  )
}
