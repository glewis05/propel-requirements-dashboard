"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import Image from "next/image"
import { Menu, LogOut, User as UserIcon } from "lucide-react"
import { MobileNav } from "./mobile-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"

type UserProfile = Database["public"]["Tables"]["users"]["Row"]

interface HeaderProps {
  user: User
  profile: UserProfile | null
}

export function Header({ user, profile }: HeaderProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const closeMobileNav = useCallback(() => setShowMobileNav(false), [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMenu])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden -m-2.5 p-2.5 text-muted-foreground hover:text-foreground"
        onClick={() => setShowMobileNav(!showMobileNav)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-border lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Title - shorter on mobile */}
        <div className="flex flex-1 items-center">
          <p aria-hidden="true" className="text-lg font-semibold text-foreground">
            <span className="sm:hidden">TraceWell</span>
            <span className="hidden sm:inline">TraceWell</span>
          </p>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <NotificationBell />

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center gap-3 -m-1.5 p-1.5"
              onClick={() => setShowMenu(!showMenu)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-foreground">
                  {profile?.name || user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.role || "User"}
                </p>
              </div>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-card py-2 shadow-lg ring-1 ring-border">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={showMobileNav}
        onClose={closeMobileNav}
        userRole={profile?.role || null}
        userName={profile?.name}
      />
    </header>
  )
}
