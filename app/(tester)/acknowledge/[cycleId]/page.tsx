"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, CheckCircle2, AlertTriangle, FileText, Loader2 } from "lucide-react"
import { recordAcknowledgment } from "@/app/(tester)/actions"

interface Props {
  params: { cycleId: string }
  searchParams: { cycleName?: string; redirect?: string }
}

export default function AcknowledgmentPage({ params, searchParams }: Props) {
  const router = useRouter()
  const [identityConfirmed, setIdentityConfirmed] = useState(false)
  const [hipaaAcknowledged, setHipaaAcknowledged] = useState(false)
  const [testDataAcknowledged, setTestDataAcknowledged] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allChecked = identityConfirmed && hipaaAcknowledged && testDataAcknowledged

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Get IP and user agent for audit
    const ipAddress = null // Will be captured server-side ideally
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null

    const result = await recordAcknowledgment(
      {
        cycleId: params.cycleId,
        identityConfirmed,
        hipaaAcknowledged,
        testDataFilterAcknowledged: testDataAcknowledged,
      },
      ipAddress,
      userAgent
    )

    setIsSubmitting(false)

    if (result.success) {
      const redirectTo = searchParams.redirect || "/my-tests"
      router.push(redirectTo)
    } else {
      setError(result.error || "Failed to record acknowledgment")
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-lg bg-card border border-border p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Testing Acknowledgment</h1>
          {searchParams.cycleName && (
            <p className="text-muted-foreground mt-2">
              Cycle: <span className="font-medium text-foreground">{searchParams.cycleName}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Please review and acknowledge the following before accessing your test assignments.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity Confirmation */}
          <AcknowledgmentCheckbox
            id="identity"
            checked={identityConfirmed}
            onChange={setIdentityConfirmed}
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
            title="Identity Confirmation"
            description="I confirm that I am the authorized individual assigned to perform this testing. I understand that my actions during testing are being recorded for compliance and audit purposes."
            required
          />

          {/* HIPAA Acknowledgment */}
          <AcknowledgmentCheckbox
            id="hipaa"
            checked={hipaaAcknowledged}
            onChange={setHipaaAcknowledged}
            icon={<Shield className="h-5 w-5 text-primary" />}
            title="HIPAA Test Data Acknowledgment"
            description="I acknowledge that all test data used in this testing environment is synthetic and does not contain any real Protected Health Information (PHI). I will not enter any real patient data during testing."
            required
          />

          {/* Test Data Filter Acknowledgment */}
          <AcknowledgmentCheckbox
            id="testdata"
            checked={testDataAcknowledged}
            onChange={setTestDataAcknowledged}
            icon={<FileText className="h-5 w-5 text-primary" />}
            title="Test Data Usage Agreement"
            description="I agree to only use the approved test patient data provided for this testing cycle. I will not create, modify, or use any test data that has not been pre-approved by the UAT Manager."
            required
          />

          {/* Compliance Notice */}
          <div className="rounded-md bg-muted/50 p-4 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">21 CFR Part 11 Compliance Notice:</strong>{" "}
              This acknowledgment serves as your electronic signature for this testing cycle.
              Your acknowledgment, along with a timestamp, IP address, and browser information,
              will be recorded for regulatory compliance and audit purposes.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!allChecked || isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording Acknowledgment...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                I Acknowledge and Agree
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

interface AcknowledgmentCheckboxProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon: React.ReactNode
  title: string
  description: string
  required?: boolean
}

function AcknowledgmentCheckbox({
  id,
  checked,
  onChange,
  icon,
  title,
  description,
  required,
}: AcknowledgmentCheckboxProps) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors cursor-pointer ${
        checked ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            required={required}
            className="h-5 w-5 rounded border-input text-primary focus:ring-primary cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <label htmlFor={id} className="font-medium text-foreground cursor-pointer">
              {title}
              {required && <span className="text-destructive ml-1">*</span>}
            </label>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
