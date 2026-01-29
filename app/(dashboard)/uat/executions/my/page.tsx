import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ExecutionList } from "@/components/uat/executions/ExecutionList"
import type { ExecutionStatus } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function MyExecutionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, name")
    .eq("auth_id", user.id)
    .single()

  if (!userData) redirect("/login")

  interface ExecutionRow {
    execution_id: string
    test_case_id: string
    story_id: string
    assigned_to: string
    status: ExecutionStatus
    started_at: string | null
    completed_at: string | null
    environment: string | null
    cycle_name: string | null
    assigned_at: string
  }

  const { data: executions } = await supabase
    .from("test_executions")
    .select("*")
    .eq("assigned_to", userData.user_id)
    .order("assigned_at", { ascending: false }) as { data: ExecutionRow[] | null; error: Error | null }

  // Fetch test case names
  const tcIds = Array.from(new Set((executions || []).map(e => e.test_case_id)))
  interface TCRow { test_case_id: string; title: string }
  const { data: testCases } = tcIds.length > 0
    ? await supabase
        .from("test_cases")
        .select("test_case_id, title")
        .in("test_case_id", tcIds) as { data: TCRow[] | null; error: Error | null }
    : { data: [] as TCRow[] }

  const testCaseNames: Record<string, string> = {}
  ;(testCases || []).forEach(tc => { testCaseNames[tc.test_case_id] = tc.title })

  const userNames: Record<string, string> = { [userData.user_id]: userData.name }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Tests</h1>
        <p className="text-muted-foreground">
          Tests assigned to you for execution
        </p>
      </div>

      <ExecutionList
        executions={(executions || []) as never[]}
        testCaseNames={testCaseNames}
        userNames={userNames}
      />
    </div>
  )
}
