"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { User, Check, AlertTriangle } from "lucide-react"
import { selectTestPatient } from "@/app/(tester)/actions"

interface TestPatient {
  patient_id: string
  patient_name: string
  mrn: string
  description: string | null
}

interface TestPatientSelectorProps {
  executionId: string
  patients: TestPatient[]
  selectedPatientId: string | null
  onSelect?: () => void
}

export function TestPatientSelector({
  executionId,
  patients,
  selectedPatientId,
  onSelect,
}: TestPatientSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = async (patientId: string) => {
    if (patientId === selectedPatientId) return

    setIsSelecting(true)
    setError(null)

    const result = await selectTestPatient(executionId, patientId)
    if (!result.success) {
      setError(result.error || "Failed to select patient")
    } else {
      onSelect?.()
    }

    setIsSelecting(false)
  }

  if (patients.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">No Test Patients Available</p>
            <p className="text-sm text-amber-700 mt-1">
              There are no approved test patients for this program. Please contact your UAT Manager.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-gray-500" />
        <h3 className="font-medium text-gray-900">Select Test Patient</h3>
        {!selectedPatientId && (
          <span className="text-xs text-red-600 font-medium">* Required</span>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {patients.map((patient) => {
          const isSelected = patient.patient_id === selectedPatientId
          return (
            <button
              key={patient.patient_id}
              onClick={() => handleSelect(patient.patient_id)}
              disabled={isSelecting}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white hover:bg-gray-50",
                isSelecting && "opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                  isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                )}
              >
                {isSelected ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm">{patient.patient_name}</p>
                <p className="text-xs text-gray-500">MRN: {patient.mrn}</p>
                {patient.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{patient.description}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-500">
        You must select a test patient before starting the test. Only use approved test patients with synthetic data.
      </p>
    </div>
  )
}
