import { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Library, ArrowLeft, Search, AlertTriangle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ComplianceBadge } from "@/components/compliance"
import { REQUIREMENT_LEVEL_CONFIG } from "@/lib/compliance/constants"
import { getComplianceFrameworks, getComplianceControls } from "../actions"

export const metadata: Metadata = {
  title: "Control Library",
  description: "Browse compliance controls across all frameworks",
}

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ framework?: string; search?: string; critical?: string }>
}

export default async function ControlLibraryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch frameworks and controls
  const [frameworksResult, controlsResult] = await Promise.all([
    getComplianceFrameworks(),
    getComplianceControls(undefined, {
      search: params.search,
      isCritical: params.critical === "true" ? true : undefined,
    }),
  ])

  const frameworks = frameworksResult.success ? frameworksResult.data || [] : []
  const allControls = controlsResult.success ? controlsResult.data || [] : []

  // Filter by framework if specified
  const controls = params.framework
    ? allControls.filter(c => c.framework_id === params.framework)
    : allControls

  // Group controls by framework
  const controlsByFramework = new Map<string, typeof controls>()
  controls.forEach((control) => {
    const key = control.framework_id
    const existing = controlsByFramework.get(key) || []
    existing.push(control)
    controlsByFramework.set(key, existing)
  })

  // Get framework details for display
  const frameworkMap = new Map(frameworks.map(f => [f.framework_id, f]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/compliance">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Library className="h-6 w-6" />
              Control Library
            </h1>
            <p className="text-muted-foreground">
              Browse compliance controls across all healthcare frameworks
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search controls by code, title, or description..."
                  defaultValue={params.search || ""}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              name="framework"
              defaultValue={params.framework || ""}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">All Frameworks</option>
              {frameworks.map((fw) => (
                <option key={fw.framework_id} value={fw.framework_id}>
                  {fw.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="critical"
                value="true"
                defaultChecked={params.critical === "true"}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Critical only</span>
            </label>
            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {controls.length} controls across {controlsByFramework.size} frameworks
      </div>

      {/* Controls by Framework */}
      <Accordion type="multiple" defaultValue={Array.from(controlsByFramework.keys())}>
        {Array.from(controlsByFramework.entries()).map(([frameworkId, frameworkControls]) => {
          const framework = frameworkMap.get(frameworkId)
          if (!framework) return null

          const criticalCount = frameworkControls.filter(c => c.is_critical).length

          return (
            <AccordionItem key={frameworkId} value={frameworkId}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <ComplianceBadge frameworkCode={framework.code} size="md" showLabel />
                  <span className="text-sm text-muted-foreground">
                    {frameworkControls.length} controls
                  </span>
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {criticalCount} critical
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {frameworkControls.map((control) => (
                    <Link
                      key={control.control_id}
                      href={`/compliance/controls/${control.control_id}`}
                      className="block"
                    >
                      <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-medium">
                              {control.control_code}
                            </span>
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
                              {control.subcategory && ` • ${control.subcategory}`}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Empty State */}
      {controls.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Controls Found</h3>
            <p className="text-muted-foreground">
              {params.search
                ? `No controls match "${params.search}". Try a different search term.`
                : "No compliance controls have been configured yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
