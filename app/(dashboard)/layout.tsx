import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={profile?.role || "Developer"} />
      <div className="lg:pl-64">
        <Header user={user} profile={profile} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
