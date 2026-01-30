import {
  LayoutDashboard,
  FileText,
  Activity,
  HelpCircle,
  ClipboardCheck,
  CheckCircle,
  BarChart3,
  Users,
  Settings,
  Bell,
  FlaskConical,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  Grid3X3,
  Library,
  FileCheck,
  type LucideIcon,
} from "lucide-react"
import type { UserRole } from "@/types/database"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    label: "Core",
    items: [
      {
        name: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["Portfolio Manager", "Program Manager", "Developer", "Admin"],
      },
      {
        name: "Stories",
        href: "/stories",
        icon: FileText,
        roles: ["Portfolio Manager", "Program Manager", "Developer", "Admin"],
      },
      {
        name: "Activity",
        href: "/activity",
        icon: Activity,
        roles: ["Portfolio Manager", "Program Manager", "Developer", "Admin"],
      },
    ],
  },
  {
    label: "Workflow",
    items: [
      {
        name: "Clarify",
        href: "/clarify",
        icon: HelpCircle,
        roles: ["Portfolio Manager", "Program Manager", "Developer", "Admin"],
      },
      {
        name: "Approvals",
        href: "/approvals",
        icon: CheckCircle,
        roles: ["Portfolio Manager", "Program Manager", "Admin"],
      },
    ],
  },
  {
    label: "Validation",
    items: [
      {
        name: "Validation",
        href: "/validation",
        icon: FlaskConical,
        roles: ["Portfolio Manager", "Program Manager", "Admin", "UAT Manager", "UAT Tester"],
      },
      {
        name: "Test Cycles",
        href: "/validation/cycles",
        icon: RefreshCw,
        roles: ["Portfolio Manager", "Program Manager", "Admin", "UAT Manager"],
      },
      {
        name: "Test Patients",
        href: "/validation/test-patients",
        icon: UserCheck,
        roles: ["Portfolio Manager", "Program Manager", "Admin", "UAT Manager"],
      },
    ],
  },
  {
    label: "Compliance",
    items: [
      {
        name: "Dashboard",
        href: "/compliance",
        icon: ShieldCheck,
        roles: ["Portfolio Manager", "Program Manager", "Admin"],
      },
      {
        name: "Compliance Matrix",
        href: "/compliance/matrix",
        icon: Grid3X3,
        roles: ["Portfolio Manager", "Program Manager", "Admin"],
      },
      {
        name: "Control Library",
        href: "/compliance/controls",
        icon: Library,
        roles: ["Portfolio Manager", "Program Manager", "Developer", "Admin"],
      },
      {
        name: "Audit Reports",
        href: "/compliance/reports",
        icon: FileCheck,
        roles: ["Portfolio Manager", "Program Manager", "Admin"],
      },
    ],
  },
  {
    label: "Admin",
    items: [
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
      {
        name: "Notifications",
        href: "/settings/notifications",
        icon: Bell,
        roles: ["Portfolio Manager", "Program Manager", "Developer", "Admin"],
      },
    ],
  },
]

export function getFilteredGroups(userRole: UserRole | null): NavGroup[] {
  if (!userRole) return []

  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0)
}
