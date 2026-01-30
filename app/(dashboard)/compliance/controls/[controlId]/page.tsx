import { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, AlertTriangle, FileText, ExternalLink, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ComplianceBadge, ComplianceStatusBadge } from "@/components/compliance"
import { REQUIREMENT_LEVEL_CONFIG } from "@/lib/compliance/constants"
import { getControlById, getComplianceMatrix } from "../../actions"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ controlId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { controlId } = await params
  const result = await getControlById(controlId)

  if (!result.success || !result.data) {
    return { title: "Control Not Found" }
  }

  return {
    title: `${result.data.control_code} - ${result.data.title}`,
    description: result.data.description || undefined,
  }
}

export default async function ControlDetailPage({ params }: PageProps) {
  const { controlId } = await params
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch control details
  const controlResult = await getControlById(controlId)

  if (!controlResult.success || !controlResult.data) {
    notFound()
  }

  const control = controlResult.data

  // Fetch stories mapped to this control
  const matrixResult = await getComplianceMatrix({ limit: 100 })
  const mappedStories = matrixResult.success
    ? (matrixResult.data || []).filter(m => m.control_id === controlId)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/compliance/controls">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Link>
        </Button>
      </div>

      {/* Control Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold font-mono">{control.control_code}</h1>
            {control.framework_code && (
              <ComplianceBadge frameworkCode={control.framework_code} size="md" showLabel />
            )}
            {control.is_critical && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Critical
              </Badge>
            )}
            {control.requirement_type && (
              <Badge variant="outline">
                {REQUIREMENT_LEVEL_CONFIG[control.requirement_type]?.label}
              </Badge>
            )}
          </div>
          <h2 className="text-xl text-muted-foreground">{control.title}</h2>
          {control.category && (
            <p className="text-sm text-muted-foreground mt-1">
              {control.category}
              {control.subcategory && ` • ${control.subcategory}`}
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {control.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{control.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Implementation Guidance */}
          {control.guidance_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Implementation Guidance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{control.guidance_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Evidence Requirements */}
          {control.evidence_requirements && (
            <Card>
              <CardHeader>
                <CardTitle>Evidence Requirements</CardTitle>
                <CardDescription>
                  Documentation needed to demonstrate compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{control.evidence_requirements}</p>
              </CardContent>
            </Card>
          )}

          {/* Mapped Stories */}
          <Card>
            <CardHeader>
              <CardTitle>Mapped Stories</CardTitle>
              <CardDescription>
                {mappedStories.length} stories are mapped to this control
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mappedStories.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No stories have been mapped to this control yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {mappedStories.map((mapping) => (
                    <Link
                      key={mapping.mapping_id}
                      href={`/stories/${mapping.story_id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{mapping.story_id}</span>
                            {mapping.compliance_status && (
                              <ComplianceStatusBadge
                                status={mapping.compliance_status}
                                size="sm"
                              />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {mapping.story_title}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Framework Info */}
          <Card>
            <CardHeader>
              <CardTitle>Framework</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{control.framework_name}</p>
              </div>
              {control.framework?.regulatory_body && (
                <div>
                  <p className="text-sm text-muted-foreground">Regulatory Body</p>
                  <p className="font-medium">{control.framework.regulatory_body}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Control Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Requirement Type</p>
                <p className="font-medium">
                  {control.requirement_type
                    ? REQUIREMENT_LEVEL_CONFIG[control.requirement_type]?.label
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critical Control</p>
                <p className="font-medium">{control.is_critical ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{control.is_active ? "Active" : "Inactive"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Mappings</span>
                <span className="font-medium">{mappedStories.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Verified</span>
                <span className="font-medium text-green-600">
                  {mappedStories.filter(m => m.compliance_status === "verified").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Implemented</span>
                <span className="font-medium text-emerald-600">
                  {mappedStories.filter(m => m.compliance_status === "implemented").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <span className="font-medium text-yellow-600">
                  {mappedStories.filter(m => m.compliance_status === "in_progress").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
