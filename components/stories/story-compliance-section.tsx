"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Plus, History, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ComplianceBadge,
  ComplianceStatusBadge,
  ComplianceControlSelector,
  ComplianceMappingForm,
  ComplianceHistoryCompact,
} from "@/components/compliance"
import type {
  StoryComplianceMappingWithDetails,
  ComplianceMappingHistory,
} from "@/types/compliance"
import type { UserRole } from "@/types/database"

interface StoryComplianceSectionProps {
  storyId: string
  mappings: StoryComplianceMappingWithDetails[]
  history?: ComplianceMappingHistory[]
  userRole: UserRole | null
  isOpen?: boolean
}

export function StoryComplianceSection({
  storyId,
  mappings,
  history = [],
  userRole,
  isOpen = true,
}: StoryComplianceSectionProps) {
  const router = useRouter()
  const [expandedMapping, setExpandedMapping] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const canEdit = userRole && ["Admin", "Portfolio Manager", "Program Manager"].includes(userRole)
  const canVerify = userRole && ["Admin", "Portfolio Manager"].includes(userRole)
  const canDelete = userRole && ["Admin", "Portfolio Manager"].includes(userRole)

  // Group mappings by framework
  const mappingsByFramework = new Map<string, StoryComplianceMappingWithDetails[]>()
  mappings.forEach((mapping) => {
    const key = mapping.framework_code || "Unknown"
    const existing = mappingsByFramework.get(key) || []
    existing.push(mapping)
    mappingsByFramework.set(key, existing)
  })

  const existingControlIds = mappings.map((m) => m.control_id)

  // Stats
  const totalMappings = mappings.length
  const verifiedCount = mappings.filter((m) => m.status === "verified").length
  const implementedCount = mappings.filter((m) => m.status === "implemented").length
  const criticalCount = mappings.filter((m) => m.control?.is_critical).length

  return (
    <Card>
      <Collapsible defaultOpen={isOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance
                {totalMappings > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalMappings} control{totalMappings !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {verifiedCount > 0 && (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {verifiedCount} verified
                  </Badge>
                )}
                {criticalCount > 0 && (
                  <Badge variant="outline" className="text-red-600 border-red-300">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {criticalCount} critical
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>
              Healthcare compliance controls mapped to this story
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Actions */}
            {canEdit && (
              <div className="flex items-center gap-2">
                <ComplianceControlSelector
                  storyId={storyId}
                  existingControlIds={existingControlIds}
                  onMappingCreated={() => router.refresh()}
                  triggerButton={
                    <Button size="sm" variant="outline">
                      <Plus className="mr-1 h-4 w-4" />
                      Add Controls
                    </Button>
                  }
                />
                {history.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <History className="mr-1 h-4 w-4" />
                    {showHistory ? "Hide" : "Show"} History
                  </Button>
                )}
              </div>
            )}

            {/* Mappings by Framework */}
            {totalMappings === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No compliance controls mapped to this story.</p>
                {canEdit && (
                  <p className="text-sm mt-1">
                    Click &ldquo;Add Controls&rdquo; to map regulatory requirements.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(mappingsByFramework.entries()).map(([frameworkCode, fwMappings]) => (
                  <div key={frameworkCode} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ComplianceBadge frameworkCode={frameworkCode} size="sm" showLabel />
                      <span className="text-sm text-muted-foreground">
                        {fwMappings.length} control{fwMappings.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      {fwMappings.map((mapping) => (
                        <div
                          key={mapping.mapping_id}
                          className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => canEdit && setExpandedMapping(mapping.mapping_id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-medium">
                                {mapping.control_code}
                              </span>
                              <ComplianceStatusBadge
                                status={mapping.status}
                                size="sm"
                              />
                              {mapping.control?.is_critical && (
                                <Badge variant="destructive" className="text-xs">
                                  Critical
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {mapping.control_title}
                            </p>
                            {mapping.verified_at && (
                              <p className="text-xs text-green-600 mt-1">
                                Verified by {mapping.verified_by_name} on{" "}
                                {new Date(mapping.verified_at).toLocaleDateString()}
                              </p>
                            )}
                            {mapping.target_date && !mapping.verified_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Target: {new Date(mapping.target_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {canEdit && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* History Section */}
            {showHistory && history.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Recent Changes</h4>
                <ComplianceHistoryCompact history={history} limit={5} />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Mapping Edit Dialog */}
      {expandedMapping && (
        <ComplianceMappingForm
          mapping={mappings.find((m) => m.mapping_id === expandedMapping)!}
          open={!!expandedMapping}
          onOpenChange={(open) => !open && setExpandedMapping(null)}
          canVerify={canVerify || false}
          canDelete={canDelete || false}
        />
      )}
    </Card>
  )
}
