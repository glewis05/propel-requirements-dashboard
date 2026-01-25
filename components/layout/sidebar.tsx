"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/database"
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  Users,
  Settings,
  BarChart3,
} from "lucide-react"

interface SidebarProps {
  userRole: UserRole | null
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["Portfolio Manager", "Program Manager", "Developer", "Admin"],
  },
  {
    name: "User Stories",
    href: "/stories",
    icon: FileText,
    roles: ["Portfolio Manager", "Program Manager", "Developer", "Admin"],
  },
  {
    name: "Approvals",
    href: "/approvals",
    icon: CheckCircle,
    roles: ["Portfolio Manager", "Program Manager", "Admin"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["Portfolio Manager", "Program Manager", "Admin"],
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["Admin"],
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["Admin"],
  },
]

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const filteredNavigation = navigation.filter(
    (item) => userRole && item.roles.includes(userRole)
  )

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-secondary px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <svg
                className="h-6 w-6 text-primary-foreground"
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
              <span className="text-lg font-bold text-white">Propel Health</span>
              <p className="text-xs text-white/60">Requirements</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex gap-x-3 rounded-md p-2.5 text-sm font-medium leading-6 transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-primary-foreground" : "text-white/50 group-hover:text-white"
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Role Badge */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs font-medium text-white/80">{userRole}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
