import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { TestCaseList } from "@/components/uat/test-cases/TestCaseList"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TestCasesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) redirect("/login")

  const canCreate = ["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(userData.role || "")

  const { data: testCases } = await supabase
    .from("test_cases")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Test Cases</h1>
          <p className="text-muted-foreground">
            Manage test cases for user acceptance testing
          </p>
        </div>
        {canCreate && (
          <Link
            href="/uat/test-cases/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Test Case
          </Link>
        )}
      </div>

      <TestCaseList testCases={(testCases as never[]) || []} />
    </div>
  )
}
