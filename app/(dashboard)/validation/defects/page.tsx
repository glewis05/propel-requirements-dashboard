import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DefectList } from "@/components/uat/defects/DefectList"
import type { DefectSeverity, DefectStatus } from "@/types/database"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DefectsPage() {
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
    title: string
    description: string | null
    severity: DefectSeverity
    status: DefectStatus
    story_id: string
    reported_by: string
    created_at: string
  }

  const { data: defects } = await supabase
    .from("defects")
    .select("defect_id, title, description, severity, status, story_id, reported_by, created_at")
    .order("created_at", { ascending: false }) as { data: DefectRow[] | null; error: Error | null }

  // Fetch user names
  const reporterIds = Array.from(new Set((defects || []).map(d => d.reported_by)))
  interface UserRow { user_id: string; name: string }
  const { data: reporters } = reporterIds.length > 0
    ? await supabase
        .from("users")
        .select("user_id, name")
        .in("user_id", reporterIds) as { data: UserRow[] | null; error: Error | null }
    : { data: [] as UserRow[] }

  const userNames: Record<string, string> = {}
  ;(reporters || []).forEach(u => { userNames[u.user_id] = u.name })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Defects</h1>
          <p className="text-muted-foreground">
            Track and manage defects found during testing
          </p>
        </div>
        <Link
          href="/validation/defects/new"
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Report Defect
        </Link>
      </div>

      <DefectList
        defects={(defects || []) as never[]}
        userNames={userNames}
      />
    </div>
  )
}
