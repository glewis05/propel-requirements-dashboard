"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface InstructionsPanelProps {
  testData?: string | null
  preconditions?: string | null
  testPatientNotes?: string | null
}

export function InstructionsPanel({
  testData,
  preconditions,
  testPatientNotes,
}: InstructionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const hasContent = testData || preconditions || testPatientNotes

  if (!hasContent) return null

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium text-gray-900">Test Instructions & Setup</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* HIPAA Warning */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>HIPAA Reminder:</strong> Use only the approved test patient for this test.
              Do not use any real patient data.
            </p>
          </div>

          {/* Preconditions */}
          {preconditions && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Preconditions</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                {preconditions}
              </p>
            </div>
          )}

          {/* Test Data */}
          {testData && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Test Data</h4>
              <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 font-mono">
                {testData}
              </div>
            </div>
          )}

          {/* Test Patient Notes */}
          {testPatientNotes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Test Patient Information</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-blue-50 rounded-lg p-3 border border-blue-100">
                {testPatientNotes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Collapsible section for use in other places
export function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  icon,
}: {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  icon?: React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm text-gray-900">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-3 pt-0">{children}</div>
      </div>
    </div>
  )
}
