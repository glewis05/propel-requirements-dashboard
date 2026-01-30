import { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Grid3X3, ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComplianceMatrixGrid } from "@/components/compliance"
import { getComplianceMatrix, getComplianceFrameworks, exportComplianceCSV } from "../actions"

export const metadata: Metadata = {
  title: "Compliance Matrix",
  description: "View compliance mappings across stories and controls",
}

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ program?: string; framework?: string; critical?: string }>
}

export default async function ComplianceMatrixPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Check role permissions
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single()

  if (!userData || !["Admin", "Portfolio Manager", "Program Manager"].includes(userData.role || "")) {
    redirect("/dashboard")
  }

  // Fetch data
  const [matrixResult, frameworksResult, programsResult] = await Promise.all([
    getComplianceMatrix({
      programId: params.program,
      frameworkCode: params.framework,
      limit: 500,
    }),
    getComplianceFrameworks(),
    supabase.from("programs").select("program_id, name").eq("status", "active"),
  ])

  const matrixData = matrixResult.success ? matrixResult.data || [] : []
  const frameworks = frameworksResult.success ? frameworksResult.data || [] : []
  const programs = programsResult.data || []

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
              <Grid3X3 className="h-6 w-6" />
              Compliance Matrix
            </h1>
            <p className="text-muted-foreground">
              View and manage compliance mappings across stories and controls
            </p>
          </div>
        </div>
        <form action={async () => {
          "use server"
          const result = await exportComplianceCSV("matrix", {
            programId: params.program,
            frameworkCode: params.framework,
          })
          // Note: In production, this would trigger a download
          // For now, the CSV generation is available via the action
        }}>
          <Button variant="outline" type="submit">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </form>
      </div>

      {/* Matrix Grid */}
      <ComplianceMatrixGrid
        data={matrixData}
        programs={programs}
        frameworks={frameworks.map(f => ({
          framework_id: f.framework_id,
          code: f.code,
          name: f.name,
        }))}
      />

      {/* Empty State */}
      {matrixData.length === 0 && (
        <div className="text-center py-12">
          <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Compliance Mappings</h3>
          <p className="text-muted-foreground mb-4">
            Start by mapping compliance controls to your user stories.
          </p>
          <Button asChild>
            <Link href="/stories">
              Go to Stories
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
