import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TesterHeader } from "@/components/tester/TesterHeader"

export default async function TesterLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    .select("user_id, name, email, role")
    .eq("auth_id", user.id)
    .single()

  if (!profile) {
    redirect("/login?error=User profile not found")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TesterHeader
        userName={profile.name}
        userEmail={profile.email}
      />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
