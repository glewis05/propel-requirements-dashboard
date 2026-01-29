import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UATDashboard } from "@/components/uat/dashboard/UATDashboard"
import type { UserRole } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function UATPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) redirect("/login")

  const userRole = userData.role as UserRole

  // Fetch test case count
  const { count: totalTestCases } = await supabase
    .from("test_cases")
    .select("*", { count: "exact", head: true })
    .eq("is_archived", false)

  // Fetch execution stats
  const { data: executions } = await supabase
    .from("test_executions")
    .select("execution_id, status")

  const totalExecutions = executions?.length || 0
  const passedCount = executions?.filter(e => e.status === "passed").length || 0
  const failedCount = executions?.filter(e => e.status === "failed").length || 0
  const blockedCount = executions?.filter(e => e.status === "blocked").length || 0
  const pendingCount = executions?.filter(e => ["assigned", "in_progress"].includes(e.status)).length || 0
  const verifiedCount = executions?.filter(e => e.status === "verified").length || 0

  // Fetch defect stats
  const { data: defects } = await supabase
    .from("defects")
    .select("defect_id, severity, status")
    .not("status", "in", '("verified","closed")')

  const openDefects = defects?.length || 0
  const criticalDefects = defects?.filter(d => d.severity === "critical").length || 0

  // Fetch tester workloads
  interface WorkloadRow {
    assigned_to: string
    status: string
  }
  const { data: workloadData } = await supabase
    .from("test_executions")
    .select("assigned_to, status") as { data: WorkloadRow[] | null; error: Error | null }

  // Get user names for testers
  const testerIds = Array.from(new Set(workloadData?.map(w => w.assigned_to) || []))
  interface UserNameRow { user_id: string; name: string }
  const { data: testerUsers } = testerIds.length > 0
    ? await supabase
        .from("users")
        .select("user_id, name")
        .in("user_id", testerIds) as { data: UserNameRow[] | null; error: Error | null }
    : { data: [] as UserNameRow[] }

  const testerNameMap = new Map((testerUsers || []).map(u => [u.user_id, u.name]))

  const testerWorkloads = testerIds.map(id => {
    const assignments = workloadData?.filter(w => w.assigned_to === id) || []
    return {
      userId: id,
      name: testerNameMap.get(id) || "Unknown",
      totalAssigned: assignments.length,
      notStarted: assignments.filter(a => a.status === "assigned").length,
      inProgress: assignments.filter(a => a.status === "in_progress").length,
      passed: assignments.filter(a => a.status === "passed").length,
      failed: assignments.filter(a => a.status === "failed").length,
      blocked: assignments.filter(a => a.status === "blocked").length,
    }
  })

  // Fetch stories in UAT with test progress
  interface StoryRow { story_id: string; title: string }
  const { data: uatStories } = await supabase
    .from("user_stories")
    .select("story_id, title")
    .eq("status", "In UAT") as { data: StoryRow[] | null; error: Error | null }

  interface StoryExecRow { story_id: string; status: string }
  const storyIds = (uatStories || []).map(s => s.story_id)
  const { data: storyExecs } = storyIds.length > 0
    ? await supabase
        .from("test_executions")
        .select("story_id, status")
        .in("story_id", storyIds) as { data: StoryExecRow[] | null; error: Error | null }
    : { data: [] as StoryExecRow[] }

  interface StoryDefectRow { story_id: string; defect_id: string }
  const { data: storyDefects } = storyIds.length > 0
    ? await supabase
        .from("defects")
        .select("story_id, defect_id")
        .in("story_id", storyIds)
        .not("status", "in", '("verified","closed")') as { data: StoryDefectRow[] | null; error: Error | null }
    : { data: [] as StoryDefectRow[] }

  const storyProgress = (uatStories || []).map(story => {
    const execs = (storyExecs || []).filter(e => e.story_id === story.story_id)
    const completed = execs.filter(e => ["passed", "failed", "blocked", "verified"].includes(e.status))
    const passed = execs.filter(e => ["passed", "verified"].includes(e.status))
    const defectCount = (storyDefects || []).filter(d => d.story_id === story.story_id).length

    return {
      storyId: story.story_id,
      storyTitle: story.title,
      totalTests: execs.length,
      completedTests: completed.length,
      passRate: execs.length > 0 ? Math.round((passed.length / execs.length) * 100) : 0,
      openDefects: defectCount,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">UAT Dashboard</h1>
        <p className="text-muted-foreground">
          User Acceptance Testing overview and management
        </p>
      </div>

      <UATDashboard
        stats={{
          totalTestCases: totalTestCases || 0,
          totalExecutions,
          passedCount,
          failedCount,
          blockedCount,
          pendingCount,
          verifiedCount,
          openDefects,
          criticalDefects,
        }}
        testerWorkloads={testerWorkloads}
        storyProgress={storyProgress}
        userRole={userRole}
      />
    </div>
  )
}
