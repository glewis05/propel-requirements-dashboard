"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/database"
import { getFilteredGroups } from "@/lib/navigation"
import { TracewellLogo } from "@/components/ui/tracewell-logo"

interface SidebarProps {
  userRole: UserRole | null
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const groups = getFilteredGroups(userRole)

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-propel-navy px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center gap-3">
            <TracewellLogo size="sm" />
            <div>
              <span className="text-lg font-bold text-white">TraceWell</span>
              <p className="text-[10px] text-white/60">Compliance Backbone</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase tracking-wider text-white/40 px-2.5 mb-2">
                  {group.label}
                </p>
                <ul role="list" className="flex flex-col gap-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-md text-sm font-medium leading-6 transition-colors",
                            isActive
                              ? "border-l-[3px] border-propel-gold bg-primary text-primary-foreground pl-[7px] pr-2.5 py-2.5"
                              : "text-white/70 hover:bg-white/10 hover:text-white p-2.5"
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
              </div>
            ))}
          </div>
        </nav>

        {/* Role Badge */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs font-medium text-white/80">{userRole}</span>
          </div>
        </div>

        {/* Powered by Propel Health */}
        <div className="border-t border-white/10 pt-3 mt-auto">
          <p className="text-[10px] text-white/40 text-center">
            Powered by <span className="text-propel-gold font-medium">Propel Health</span>
          </p>
        </div>
      </div>
    </div>
  )
}
