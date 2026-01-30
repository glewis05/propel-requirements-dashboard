import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TesterHeader } from "@/components/tester/tester-header"
import type { UserRole } from "@/types/database"

export default async function TesterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/my-tests")
  }

  // Fetch user profile
  const { data: userData } = await supabase
    .from("users")
    .select("user_id, name, email, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    // User authenticated but no profile - shouldn't happen for invited testers
    redirect("/login?error=no_profile")
  }

  const userRole = userData.role as UserRole

  // Allow UAT Testers and also higher roles (they might want to preview tester experience)
  const allowedRoles: UserRole[] = ["UAT Tester", "UAT Manager", "Program Manager", "Portfolio Manager", "Admin"]

  if (!allowedRoles.includes(userRole)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <TesterHeader
        userName={userData.name}
        userEmail={userData.email}
        userRole={userRole}
      />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {children}
      </main>
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-xs text-muted-foreground text-center">
            Powered by Propel Health Platform
          </p>
        </div>
      </footer>
    </div>
  )
}
