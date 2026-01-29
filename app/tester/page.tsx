import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CycleSelector } from "@/components/tester/CycleSelector"
import { getMyCycles } from "@/app/(dashboard)/uat/cycles/cycle-actions"

export const metadata = {
  title: "UAT Testing Portal | Providence Healthcare",
  description: "User Acceptance Testing portal for Providence Healthcare",
}

export default async function TesterPortalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/tester")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("user_id, name, role")
    .eq("auth_id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  // Get cycles assigned to this tester
  const cyclesResult = await getMyCycles()
  const cycles = cyclesResult.success ? cyclesResult.cycles || [] : []

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl border p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile.name.split(" ")[0]}
        </h1>
        <p className="text-gray-600 mt-1">
          Select a testing cycle below to view your assigned tests.
        </p>
      </div>

      {/* Cycle Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Testing Cycles</h2>
        <CycleSelector cycles={cycles} />
      </div>
    </div>
  )
}
