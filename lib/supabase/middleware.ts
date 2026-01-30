import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes only accessible by testers
const TESTER_ROUTES = ["/my-tests", "/execute", "/acknowledge", "/my-defects", "/tester-help"]

// Routes only accessible by admins/managers (not testers)
const ADMIN_ROUTES = [
  "/dashboard",
  "/stories",
  "/approvals",
  "/admin",
  "/validation",
  "/clarify",
  "/compliance",
  "/reports",
  "/activity",
  "/settings",
]

function isTesterRoute(pathname: string): boolean {
  return TESTER_ROUTES.some(route => pathname.startsWith(route))
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes - redirect to login if not authenticated
  const isAuthRoute = pathname.startsWith("/login")
  const isProtectedRoute = isAdminRoute(pathname) || isTesterRoute(pathname)

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Role-based routing for authenticated users
  if (user) {
    // Fetch user role from database
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single()

    const userRole = userData?.role || "Developer"
    const isTester = userRole === "UAT Tester"

    // Redirect authenticated users away from login page
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      // Testers go to my-tests, others go to dashboard
      url.pathname = isTester ? "/my-tests" : "/dashboard"
      return NextResponse.redirect(url)
    }

    // Handle root path - redirect based on role
    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = isTester ? "/my-tests" : "/dashboard"
      return NextResponse.redirect(url)
    }

    // Testers trying to access admin routes - redirect to my-tests
    if (isTester && isAdminRoute(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = "/my-tests"
      return NextResponse.redirect(url)
    }

    // Non-testers trying to access tester-only routes can still access them
    // (managers may want to see tester view for debugging)
  }

  return supabaseResponse
}
