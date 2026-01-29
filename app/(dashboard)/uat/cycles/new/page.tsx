"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createCycle, type CycleFormData } from "../cycle-actions"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, RefreshCw } from "lucide-react"

export default function NewCyclePage() {
  const router = useRouter()
  const [programs, setPrograms] = useState<{ program_id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CycleFormData>({
    name: "",
    description: "",
    program_id: "",
    distribution_method: "equal",
    cross_validation_enabled: false,
    cross_validation_percentage: 20,
    validators_per_test: 3,
    start_date: "",
    end_date: "",
  })

  useEffect(() => {
    async function loadPrograms() {
      const supabase = createClient()
      const { data } = await supabase
        .from("programs")
        .select("program_id, name")
        .eq("status", "Active")
        .order("name")

      setPrograms(data || [])
      setIsLoading(false)
    }
    loadPrograms()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.program_id) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await createCycle(formData)

    if (!result.success) {
      setError(result.error || "Failed to create cycle")
      setIsSubmitting(false)
      return
    }

    router.push(`/uat/cycles/${result.cycleId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/uat/cycles"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycles
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create New Cycle</h1>
        <p className="text-muted-foreground">
          Set up a new UAT testing cycle with assignment configuration
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Cycle Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sprint 24 UAT"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Program <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.program_id}
              onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">Select a program</option>
              {programs.map((p) => (
                <option key={p.program_id} value={p.program_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of this testing cycle..."
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Start Date</label>
              <input
                type="date"
                value={formData.start_date || ""}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">End Date</label>
              <input
                type="date"
                value={formData.end_date || ""}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Distribution Settings */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Assignment Configuration</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Distribution Method</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="distribution"
                  checked={formData.distribution_method === "equal"}
                  onChange={() => setFormData({ ...formData, distribution_method: "equal" })}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium text-sm">Equal (Round-Robin)</p>
                  <p className="text-xs text-muted-foreground">
                    Distribute tests evenly across all testers
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                <input
                  type="radio"
                  name="distribution"
                  checked={formData.distribution_method === "weighted"}
                  onChange={() => setFormData({ ...formData, distribution_method: "weighted" })}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium text-sm">Weighted</p>
                  <p className="text-xs text-muted-foreground">
                    Distribute based on tester capacity weights
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Cross-Validation Settings */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Cross-Validation</h2>
              <p className="text-sm text-muted-foreground">
                Assign some tests to multiple testers for validation
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.cross_validation_enabled}
                onChange={(e) =>
                  setFormData({ ...formData, cross_validation_enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {formData.cross_validation_enabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Percentage of Tests (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={formData.cross_validation_percentage || 20}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cross_validation_percentage: parseInt(e.target.value) || 20,
                    })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage of tests to cross-validate
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Validators per Test
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={formData.validators_per_test || 3}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validators_per_test: parseInt(e.target.value) || 3,
                    })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of testers per cross-validation test
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/uat/cycles"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Cycle"}
          </button>
        </div>
      </form>
    </div>
  )
}
