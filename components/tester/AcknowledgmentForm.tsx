"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { recordAcknowledgment } from "@/app/tester/acknowledgment-actions"

interface AcknowledgmentFormProps {
  cycleId: string
  cycleName: string
}

export function AcknowledgmentForm({ cycleId, cycleName }: AcknowledgmentFormProps) {
  const router = useRouter()
  const [identityConfirmed, setIdentityConfirmed] = useState(false)
  const [hipaaAcknowledged, setHipaaAcknowledged] = useState(false)
  const [testDataAcknowledged, setTestDataAcknowledged] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = identityConfirmed && hipaaAcknowledged && testDataAcknowledged

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    // Get client info for audit
    const userAgent = navigator.userAgent

    const result = await recordAcknowledgment(
      {
        cycleId,
        identityConfirmed,
        hipaaAcknowledged,
        testDataFilterAcknowledged: testDataAcknowledged,
      },
      null, // IP address will be captured server-side if needed
      userAgent
    )

    if (!result.success) {
      setError(result.error || "Failed to record acknowledgment")
      setIsSubmitting(false)
      return
    }

    // Redirect to cycle dashboard
    router.push(`/tester/cycle/${cycleId}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-propel-navy px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-propel-gold" />
            <div>
              <h1 className="text-xl font-bold">Testing Acknowledgment Required</h1>
              <p className="text-white/80 text-sm">{cycleName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Intro */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important Compliance Notice</p>
              <p>
                Before proceeding with User Acceptance Testing, you must acknowledge the following
                requirements to ensure compliance with 21 CFR Part 11 and HIPAA regulations.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Acknowledgments */}
          <div className="space-y-4">
            {/* Identity Confirmation */}
            <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={identityConfirmed}
                onChange={(e) => setIdentityConfirmed(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">Identity Confirmation</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  I confirm that I am the person logged into this account and that I am authorized
                  to perform testing activities for this cycle. I understand that my identity has
                  been verified through secure authentication.
                </p>
              </div>
            </label>

            {/* HIPAA Acknowledgment */}
            <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={hipaaAcknowledged}
                onChange={(e) => setHipaaAcknowledged(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">HIPAA Test Data Acknowledgment</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  I understand that I must use only designated test patients with synthetic data
                  for all testing activities. I will not use real patient information under any
                  circumstances. I acknowledge my responsibility to protect the confidentiality
                  of all test data I encounter.
                </p>
              </div>
            </label>

            {/* Test Data Filter */}
            <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={testDataAcknowledged}
                onChange={(e) => setTestDataAcknowledged(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">Approved Test Data Only</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  I confirm that I will only use the pre-approved test patients provided in the
                  testing portal. I understand that creating or using unapproved test data may
                  violate compliance requirements and could result in disciplinary action.
                </p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Recording Acknowledgment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  I Acknowledge and Agree to Proceed
                </>
              )}
            </button>
            <p className="text-xs text-center text-gray-500 mt-3">
              Your acknowledgment will be recorded with a timestamp for compliance purposes.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
