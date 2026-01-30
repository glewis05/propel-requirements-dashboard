"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ComplianceBadge } from "./compliance-badge"
import { REQUIREMENT_LEVEL_CONFIG } from "@/lib/compliance/constants"
import type { ComplianceFramework, ComplianceControlWithFramework } from "@/types/compliance"
import { getComplianceFrameworks, getComplianceControls, createComplianceMapping } from "@/app/(dashboard)/compliance/actions"

interface ComplianceControlSelectorProps {
  storyId: string
  existingControlIds?: string[]
  onMappingCreated?: () => void
  triggerButton?: React.ReactNode
}

export function ComplianceControlSelector({
  storyId,
  existingControlIds = [],
  onMappingCreated,
  triggerButton,
}: ComplianceControlSelectorProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const [controls, setControls] = useState<ComplianceControlWithFramework[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedFramework, setSelectedFramework] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCriticalOnly, setShowCriticalOnly] = useState(false)

  // Selection
  const [selectedControlIds, setSelectedControlIds] = useState<Set<string>>(new Set())

  // Load frameworks on mount
  useEffect(() => {
    async function loadFrameworks() {
      const result = await getComplianceFrameworks()
      if (result.success) {
        setFrameworks(result.data || [])
      }
    }
    loadFrameworks()
  }, [])

  // Load controls when dialog opens or filters change
  useEffect(() => {
    if (!open) return

    async function loadControls() {
      setLoading(true)
      const result = await getComplianceControls(
        selectedFramework !== "all" ? selectedFramework : undefined,
        {
          search: searchQuery || undefined,
          isCritical: showCriticalOnly ? true : undefined,
        }
      )
      if (result.success) {
        // Filter out already mapped controls
        const available = (result.data || []).filter(
          (c) => !existingControlIds.includes(c.control_id)
        )
        setControls(available)
      }
      setLoading(false)
    }
    loadControls()
  }, [open, selectedFramework, searchQuery, showCriticalOnly, existingControlIds])

  const handleToggleControl = (controlId: string) => {
    setSelectedControlIds((prev) => {
      const next = new Set(prev)
      if (next.has(controlId)) {
        next.delete(controlId)
      } else {
        next.add(controlId)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selectedControlIds.size === 0) return

    setSubmitting(true)
    setError(null)

    let successCount = 0
    for (const controlId of selectedControlIds) {
      const result = await createComplianceMapping({
        story_id: storyId,
        control_id: controlId,
      })
      if (result.success) {
        successCount++
      }
    }

    setSubmitting(false)

    if (successCount > 0) {
      setSelectedControlIds(new Set())
      setOpen(false)
      onMappingCreated?.()
      router.refresh()
    } else {
      setError("Failed to create mappings. Please try again.")
    }
  }

  const filteredControls = controls.filter((control) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        control.control_code.toLowerCase().includes(query) ||
        control.title.toLowerCase().includes(query) ||
        control.description?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" variant="outline">
            <Plus className="mr-1 h-4 w-4" />
            Add Controls
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Compliance Controls</DialogTitle>
          <DialogDescription>
            Select controls to map to this story. Selected: {selectedControlIds.size}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search controls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Frameworks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                {frameworks.map((fw) => (
                  <SelectItem key={fw.framework_id} value={fw.framework_id}>
                    {fw.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Checkbox
                id="critical-only"
                checked={showCriticalOnly}
                onCheckedChange={(checked) => setShowCriticalOnly(checked === true)}
              />
              <Label htmlFor="critical-only" className="text-sm cursor-pointer">
                Critical only
              </Label>
            </div>
          </div>

          {/* Controls list */}
          <ScrollArea className="h-[400px] rounded-md border p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading controls...
              </div>
            ) : filteredControls.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No controls found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredControls.map((control) => (
                  <div
                    key={control.control_id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedControlIds.has(control.control_id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleToggleControl(control.control_id)}
                  >
                    <Checkbox
                      checked={selectedControlIds.has(control.control_id)}
                      onCheckedChange={() => handleToggleControl(control.control_id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium">
                          {control.control_code}
                        </span>
                        {control.framework_code && (
                          <ComplianceBadge
                            frameworkCode={control.framework_code}
                            size="sm"
                          />
                        )}
                        {control.is_critical && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Critical
                          </Badge>
                        )}
                        {control.requirement_type && (
                          <Badge variant="outline" className="text-xs">
                            {REQUIREMENT_LEVEL_CONFIG[control.requirement_type]?.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1">{control.title}</p>
                      {control.category && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {control.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedControlIds.size === 0 || submitting}
          >
            {submitting ? "Adding..." : `Add ${selectedControlIds.size} Control${selectedControlIds.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
