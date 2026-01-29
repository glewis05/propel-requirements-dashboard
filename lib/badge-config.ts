import {
  FileEdit,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Ban,
  CircleDot,
  Code,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react"

interface BadgeConfig {
  icon: LucideIcon
  className: string
}

export const statusBadgeConfig: Record<string, BadgeConfig> = {
  Draft: {
    icon: FileEdit,
    className: "bg-muted text-muted-foreground",
  },
  "Internal Review": {
    icon: Eye,
    className: "bg-primary/10 text-primary",
  },
  "Pending Client Review": {
    icon: Clock,
    className: "bg-warning/10 text-warning",
  },
  Approved: {
    icon: CheckCircle,
    className: "bg-success/10 text-success",
  },
  "Needs Discussion": {
    icon: AlertTriangle,
    className: "bg-destructive/10 text-destructive",
  },
  "Out of Scope": {
    icon: Ban,
    className: "bg-muted text-muted-foreground",
  },
  "In Development": {
    icon: Code,
    className: "bg-primary/10 text-primary",
  },
  "In UAT": {
    icon: ClipboardCheck,
    className: "bg-warning/10 text-warning",
  },
}

export const priorityBadgeConfig: Record<string, BadgeConfig> = {
  "Must Have": {
    icon: AlertTriangle,
    className: "bg-destructive/10 text-destructive",
  },
  "Should Have": {
    icon: Clock,
    className: "bg-warning/10 text-warning",
  },
  "Could Have": {
    icon: CircleDot,
    className: "bg-primary/10 text-primary",
  },
  "Won't Have": {
    icon: Ban,
    className: "bg-muted text-muted-foreground",
  },
}

export function getStatusBadge(status: string): BadgeConfig {
  return (
    statusBadgeConfig[status] ?? {
      icon: CircleDot,
      className: "bg-muted text-muted-foreground",
    }
  )
}

export function getPriorityBadge(priority: string): BadgeConfig {
  return (
    priorityBadgeConfig[priority] ?? {
      icon: CircleDot,
      className: "bg-muted text-muted-foreground",
    }
  )
}
