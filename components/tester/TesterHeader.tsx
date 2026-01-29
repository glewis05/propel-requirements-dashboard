"use client"

import Link from "next/link"
import { User, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface TesterHeaderProps {
  userName: string
  userEmail: string | null
}

export function TesterHeader({ userName, userEmail }: TesterHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/tester" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-propel-navy">
              <svg
                className="h-5 w-5 text-propel-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-propel-navy">UAT Testing Portal</span>
              <p className="text-xs text-gray-500">Providence Healthcare</p>
            </div>
          </Link>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <div className="text-right">
                <p className="font-medium text-gray-900">{userName}</p>
                {userEmail && (
                  <p className="text-xs text-gray-500">{userEmail}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
