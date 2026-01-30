"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  FlaskConical,
  ClipboardList,
  Bug,
  HelpCircle,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/types/database"

interface TesterHeaderProps {
  userName: string
  userEmail: string
  userRole: UserRole
}

const navItems = [
  { name: "My Tests", href: "/my-tests", icon: ClipboardList },
  { name: "Defects", href: "/my-defects", icon: Bug },
  { name: "Help", href: "/tester-help", icon: HelpCircle },
]

export function TesterHeader({ userName, userEmail, userRole }: TesterHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Check if user can access dashboard (non-tester roles)
  const canAccessDashboard = userRole !== "UAT Tester"

  return (
    <header className="sticky top-0 z-40 bg-navy border-b border-navy-light">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link href="/my-tests" className="flex items-center gap-2">
            <div className="p-1.5 bg-propel-gold rounded-md">
              <FlaskConical className="h-5 w-5 text-navy" />
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-semibold">UAT Testing Portal</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-white/70 hover:text-white rounded-md"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Desktop User Dropdown */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-propel-gold/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-propel-gold" />
                </div>
                <span className="hidden lg:block max-w-[120px] truncate">{userName}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">{userRole}</p>
                    </div>
                    <div className="p-1">
                      {canAccessDashboard && (
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                        >
                          <FlaskConical className="h-4 w-4" />
                          Go to Dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden pb-4 border-t border-white/10 mt-2 pt-4">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="px-3 mb-3">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-white/50 truncate">{userEmail}</p>
              </div>
              {canAccessDashboard && (
                <Link
                  href="/dashboard"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <FlaskConical className="h-5 w-5" />
                  Go to Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
