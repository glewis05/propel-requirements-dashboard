"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/database"
import { X } from "lucide-react"
import { getFilteredGroups } from "@/lib/navigation"
import { TracewellLogo } from "@/components/ui/tracewell-logo"

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  userRole: UserRole | null
  userName?: string
}

export function MobileNav({ isOpen, onClose, userRole, userName }: MobileNavProps) {
  const pathname = usePathname()

  const groups = getFilteredGroups(userRole)

  // Close nav when route changes
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Prevent body scroll when nav is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-propel-navy transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <TracewellLogo size="sm" />
              <div>
                <span className="text-lg font-bold text-white">TraceWell</span>
                <p className="text-[10px] text-white/60">Compliance Backbone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white rounded-md hover:bg-white/10 transition-colors"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-y-6">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-2">
                    {group.label}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                              isActive
                                ? "border-l-[3px] border-propel-gold bg-primary text-primary-foreground pl-[9px] pr-3 py-3"
                                : "text-white/70 hover:bg-white/10 hover:text-white px-3 py-3"
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-5 w-5 shrink-0",
                                isActive ? "text-primary-foreground" : "text-white/50"
                              )}
                            />
                            {item.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer with user info */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {userName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userName || "User"}
                </p>
                <p className="text-xs text-white/60">{userRole}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-success flex-shrink-0" />
            </div>
          </div>

          {/* Powered by Propel Health */}
          <div className="border-t border-white/10 px-4 py-3">
            <p className="text-[10px] text-white/40 text-center">
              Powered by <span className="text-propel-gold font-medium">Propel Health</span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
