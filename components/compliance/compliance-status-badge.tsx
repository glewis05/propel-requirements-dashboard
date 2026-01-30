"use client"

import { cn } from "@/lib/utils"
import { COMPLIANCE_STATUS_CONFIG, getStatusConfig } from "@/lib/compliance/constants"
import type { ComplianceStatus } from "@/types/compliance"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Circle,
  Clock,
  PlayCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
} from "lucide-react"

interface ComplianceStatusBadgeProps {
  status: ComplianceStatus
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const iconMap: Record<ComplianceStatus, React.ComponentType<{ className?: string }>> = {
  not_applicable: XCircle,
  not_started: Circle,
  planned: Clock,
  in_progress: PlayCircle,
  implemented: CheckCircle,
  verified: CheckCircle2,
  deferred: PauseCircle,
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

const badgeSizeClasses = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-1 text-sm",
  lg: "px-2.5 py-1.5 text-base",
}

export function ComplianceStatusBadge({
  status,
  showLabel = true,
  size = "sm",
  className,
}: ComplianceStatusBadgeProps) {
  const config = getStatusConfig(status)
  const Icon = iconMap[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border font-medium",
              config.bgColor,
              config.borderColor,
              config.color,
              badgeSizeClasses[size],
              className
            )}
          >
            <Icon className={sizeClasses[size]} />
            {showLabel && <span>{config.label}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ComplianceStatusSelectProps {
  value: ComplianceStatus
  onChange: (status: ComplianceStatus) => void
  disabled?: boolean
  className?: string
}

export function ComplianceStatusSelect({
  value,
  onChange,
  disabled = false,
  className,
}: ComplianceStatusSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ComplianceStatus)}
      disabled={disabled}
      className={cn(
        "rounded-md border px-2 py-1 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {Object.entries(COMPLIANCE_STATUS_CONFIG).map(([statusKey, config]) => (
        <option key={statusKey} value={statusKey}>
          {config.label}
        </option>
      ))}
    </select>
  )
}

interface ComplianceProgressBarProps {
  verified: number
  implemented: number
  inProgress: number
  total: number
  className?: string
}

export function ComplianceProgressBar({
  verified,
  implemented,
  inProgress,
  total,
  className,
}: ComplianceProgressBarProps) {
  if (total === 0) return null

  const verifiedPct = (verified / total) * 100
  const implementedPct = (implemented / total) * 100
  const inProgressPct = (inProgress / total) * 100

  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${verifiedPct}%` }}
        />
        <div
          className="bg-emerald-400 transition-all"
          style={{ width: `${implementedPct}%` }}
        />
        <div
          className="bg-yellow-400 transition-all"
          style={{ width: `${inProgressPct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>
          {verified + implemented} / {total} complete
        </span>
        <span>{Math.round(((verified + implemented) / total) * 100)}%</span>
      </div>
    </div>
  )
}
