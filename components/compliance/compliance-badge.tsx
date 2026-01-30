"use client"

import { Shield, FileCheck, ShieldCheck, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { FRAMEWORK_CONFIG } from "@/lib/compliance/constants"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ComplianceBadgeProps {
  frameworkCode: string
  count?: number
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CFR11: FileCheck,
  HIPAA: Shield,
  HITRUST: ShieldCheck,
  SOC2: Award,
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
}

const badgeSizeClasses = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-1 text-sm",
  lg: "px-2.5 py-1.5 text-base",
}

export function ComplianceBadge({
  frameworkCode,
  count,
  showLabel = false,
  size = "sm",
  className,
}: ComplianceBadgeProps) {
  const config = FRAMEWORK_CONFIG[frameworkCode]
  if (!config) return null

  const Icon = iconMap[frameworkCode] || Shield

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
            {showLabel && <span>{config.shortName}</span>}
            {count !== undefined && count > 0 && (
              <span className="ml-0.5 rounded-full bg-white/50 px-1.5 text-xs font-semibold">
                {count}
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.name}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
          {count !== undefined && (
            <p className="text-xs mt-1">{count} control{count !== 1 ? "s" : ""} mapped</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ComplianceBadgeGroupProps {
  frameworks: { code: string; count: number }[]
  size?: "sm" | "md" | "lg"
  maxDisplay?: number
  className?: string
}

export function ComplianceBadgeGroup({
  frameworks,
  size = "sm",
  maxDisplay = 4,
  className,
}: ComplianceBadgeGroupProps) {
  if (!frameworks.length) return null

  const displayFrameworks = frameworks.slice(0, maxDisplay)
  const remaining = frameworks.length - maxDisplay

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {displayFrameworks.map((fw) => (
        <ComplianceBadge
          key={fw.code}
          frameworkCode={fw.code}
          count={fw.count}
          size={size}
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">+{remaining} more</span>
      )}
    </div>
  )
}
