import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { Database } from "@/types/database"

type UsersUpdate = Database["public"]["Tables"]["users"]["Update"]

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const requestedNext = searchParams.get("next")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Update last_login_at for the user and get their role
      const { data: { user } } = await supabase.auth.getUser()
      let redirectPath = requestedNext ?? "/dashboard"

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("user_id, role")
          .eq("auth_id", user.id)
          .single()

        if (userData) {
          // Update last login
          const updateData: UsersUpdate = { last_login_at: new Date().toISOString() }
          await supabase
            .from("users")
            .update(updateData)
            .eq("auth_id", user.id)

          // Redirect UAT Testers to tester portal by default (unless they requested a specific path)
          if (!requestedNext && userData.role === "UAT Tester") {
            redirectPath = "/tester"
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
