import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DEFECT_STATUS_CONFIG } from "@/lib/uat/execution-transitions"
import type { DefectSeverity, DefectStatus, UserRole } from "@/types/database"
import { ArrowLeft, Bug, User, Clock, Globe } from "lucide-react"
import { DefectActions } from "./defect-actions"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DefectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) redirect("/login")

  interface DefectRow {
    defect_id: string
    execution_id: string | null
    test_case_id: string | null
    story_id: string
    program_id: string
    title: string
    description: string | null
    steps_to_reproduce: string | null
    expected_behavior: string | null
    actual_behavior: string | null
    severity: DefectSeverity
    status: DefectStatus
    reported_by: string
    assigned_to: string | null
    resolved_by: string | null
    resolved_at: string | null
    environment: string | null
    failed_step_number: number | null
    created_at: string
    updated_at: string
  }

  const { data: defect, error } = await supabase
    .from("defects")
    .select("*")
    .eq("defect_id", id)
    .single() as { data: DefectRow | null; error: Error | null }

  if (error || !defect) {
    notFound()
  }

  // Fetch user names
  interface UserNameRow { user_id: string; name: string }
  const relatedUserIds = [defect.reported_by, defect.assigned_to, defect.resolved_by].filter(Boolean) as string[]
  const { data: relatedUsers } = await supabase
    .from("users")
    .select("user_id, name")
    .in("user_id", relatedUserIds) as { data: UserNameRow[] | null; error: Error | null }

  const userNameMap = new Map((relatedUsers || []).map(u => [u.user_id, u.name]))

  // Fetch story title
  const { data: story } = await supabase
    .from("user_stories")
    .select("title")
    .eq("story_id", defect.story_id)
    .single()

  const statusConfig = DEFECT_STATUS_CONFIG[defect.status]

  const severityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-800 border-green-200",
  }

  // Fetch testers for assignment
  interface TesterRow { user_id: string; name: string }
  const { data: testers } = await supabase
    .from("users")
    .select("user_id, name")
    .in("role", ["UAT Manager", "UAT Tester", "Admin", "Program Manager"]) as { data: TesterRow[] | null; error: Error | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/uat/defects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Defects
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bug className="h-5 w-5 text-red-500" />
            <h1 className="text-2xl font-bold">{defect.title}</h1>
          </div>
          <p className="text-muted-foreground">
            Story: <Link href={`/stories/${defect.story_id}`} className="text-primary hover:underline">
              {defect.story_id} - {story?.title || "Unknown"}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border", statusConfig.color)}>
            {statusConfig.label}
          </span>
          <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border", severityColors[defect.severity])}>
            {defect.severity}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {defect.description && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{defect.description}</p>
            </div>
          )}

          {defect.steps_to_reproduce && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-2">Steps to Reproduce</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{defect.steps_to_reproduce}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {defect.expected_behavior && (
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-medium mb-2">Expected Behavior</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{defect.expected_behavior}</p>
              </div>
            )}
            {defect.actual_behavior && (
              <div className="rounded-lg border bg-red-50 border-red-200 p-4">
                <h3 className="font-medium mb-2 text-red-800">Actual Behavior</h3>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{defect.actual_behavior}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <DefectActions
            defectId={defect.defect_id}
            currentStatus={defect.status}
            userRole={userData.role as UserRole}
            testers={(testers || []).map(t => ({ user_id: t.user_id, name: t.name }))}
            assignedTo={defect.assigned_to}
          />

          {/* Details */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <User className="h-3 w-3" /> Reported by
                </span>
                <span>{userNameMap.get(defect.reported_by) || "Unknown"}</span>
              </div>
              {defect.assigned_to && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned to</span>
                  <span>{userNameMap.get(defect.assigned_to) || "Unknown"}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Reported
                </span>
                <span>{new Date(defect.created_at).toLocaleDateString()}</span>
              </div>
              {defect.resolved_by && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved by</span>
                  <span>{userNameMap.get(defect.resolved_by) || "Unknown"}</span>
                </div>
              )}
              {defect.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved</span>
                  <span>{new Date(defect.resolved_at).toLocaleDateString()}</span>
                </div>
              )}
              {defect.environment && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Environment
                  </span>
                  <span>{defect.environment}</span>
                </div>
              )}
              {defect.failed_step_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed Step</span>
                  <span>Step {defect.failed_step_number}</span>
                </div>
              )}
              {defect.execution_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Execution</span>
                  <Link href={`/uat/executions/${defect.execution_id}`} className="text-primary hover:underline text-xs">
                    View
                  </Link>
                </div>
              )}
              {defect.test_case_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Test Case</span>
                  <Link href={`/uat/test-cases/${defect.test_case_id}`} className="text-primary hover:underline text-xs">
                    View
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
