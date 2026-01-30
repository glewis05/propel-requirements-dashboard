import { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Settings, ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ComplianceBadge } from "@/components/compliance"
import { getComplianceFrameworks } from "../actions"

export const metadata: Metadata = {
  title: "Compliance Settings",
  description: "Configure program compliance settings",
}

export const dynamic = "force-dynamic"

export default async function ComplianceSettingsPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Check role permissions - Admin only
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single()

  if (!userData || userData.role !== "Admin") {
    redirect("/compliance")
  }

  // Fetch frameworks
  const frameworksResult = await getComplianceFrameworks(false) // Include inactive
  const frameworks = frameworksResult.success ? frameworksResult.data || [] : []

  // Fetch programs
  const { data: programs } = await supabase
    .from("programs")
    .select("program_id, name, status")
    .order("name")

  // Fetch current program settings
  const { data: settings } = await supabase
    .from("program_compliance_settings")
    .select("*")

  // Create a map of settings
  const settingsMap = new Map<string, Set<string>>()
  settings?.forEach(s => {
    const programSettings = settingsMap.get(s.program_id) || new Set()
    if (s.is_enabled) {
      programSettings.add(s.framework_id)
    }
    settingsMap.set(s.program_id, programSettings)
  })

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
            <Settings className="h-6 w-6" />
            Compliance Settings
          </h1>
          <p className="text-muted-foreground">
            Configure which compliance frameworks apply to each program
          </p>
        </div>
      </div>

      {/* Framework Status */}
      <Card>
        <CardHeader>
          <CardTitle>Available Frameworks</CardTitle>
          <CardDescription>
            Manage the compliance frameworks available in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {frameworks.map((framework) => (
              <div
                key={framework.framework_id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <ComplianceBadge frameworkCode={framework.code} size="md" showLabel />
                  <div>
                    <p className="font-medium">{framework.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {framework.regulatory_body}
                      {framework.version && ` • v${framework.version}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={framework.is_active ? "text-green-600" : "text-muted-foreground"}>
                    {framework.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Program Framework Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Program Compliance Requirements</CardTitle>
          <CardDescription>
            Select which frameworks apply to each program. This determines which controls
            are relevant during story compliance mapping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programs && programs.length > 0 ? (
            <div className="space-y-6">
              {programs.map((program) => {
                const programFrameworks = settingsMap.get(program.program_id) || new Set()

                return (
                  <div key={program.program_id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{program.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        ({program.status})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-6">
                      {frameworks.filter(f => f.is_active).map((framework) => {
                        const isEnabled = programFrameworks.has(framework.framework_id)

                        return (
                          <div
                            key={framework.framework_id}
                            className="flex items-center gap-2"
                          >
                            <Switch
                              id={`${program.program_id}-${framework.framework_id}`}
                              checked={isEnabled}
                              disabled // Read-only for now - would need form action
                            />
                            <Label
                              htmlFor={`${program.program_id}-${framework.framework_id}`}
                              className="text-sm cursor-pointer"
                            >
                              {framework.code}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No programs found. Create a program first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Compliance Settings</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            Compliance framework assignments help filter relevant controls when mapping
            stories to compliance requirements:
          </p>
          <ul>
            <li>
              <strong>21 CFR Part 11</strong> - Required for FDA-regulated software handling
              electronic records and signatures (pharmaceutical, medical devices, biologics)
            </li>
            <li>
              <strong>HIPAA</strong> - Required for software handling Protected Health Information (PHI)
            </li>
            <li>
              <strong>HITRUST</strong> - Optional certification framework combining multiple
              healthcare security standards
            </li>
            <li>
              <strong>SOC 2</strong> - Service organization controls for cloud/SaaS applications
            </li>
          </ul>
          <p className="text-muted-foreground">
            Contact your administrator to modify program compliance assignments.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
