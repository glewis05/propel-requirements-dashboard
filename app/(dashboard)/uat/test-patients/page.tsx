"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, User, RefreshCw, Trash2, Edit2, ToggleLeft, ToggleRight, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getTestPatients,
  createTestPatient,
  updateTestPatient,
  deactivateTestPatient,
  reactivateTestPatient,
  deleteTestPatient,
  type TestPatientWithProgram,
} from "./test-patient-actions"
import { cn } from "@/lib/utils"

export default function TestPatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<TestPatientWithProgram[]>([])
  const [programs, setPrograms] = useState<{ program_id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<TestPatientWithProgram | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const [formData, setFormData] = useState({
    program_id: "",
    patient_name: "",
    mrn: "",
    date_of_birth: "",
    description: "",
    test_data_notes: "",
  })

  useEffect(() => {
    loadData()
  }, [showInactive])

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    // Load programs
    const { data: programsData } = await supabase
      .from("programs")
      .select("program_id, name")
      .eq("status", "Active")
      .order("name")

    setPrograms(programsData || [])

    // Load patients
    const result = await getTestPatients({
      isActive: showInactive ? undefined : true,
    })

    if (result.success) {
      setPatients(result.patients || [])
    }

    setIsLoading(false)
  }

  const handleOpenModal = (patient?: TestPatientWithProgram) => {
    if (patient) {
      setEditingPatient(patient)
      setFormData({
        program_id: patient.program_id,
        patient_name: patient.patient_name,
        mrn: patient.mrn,
        date_of_birth: patient.date_of_birth || "",
        description: patient.description || "",
        test_data_notes: patient.test_data_notes || "",
      })
    } else {
      setEditingPatient(null)
      setFormData({
        program_id: "",
        patient_name: "",
        mrn: "",
        date_of_birth: "",
        description: "",
        test_data_notes: "",
      })
    }
    setShowModal(true)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.program_id || !formData.patient_name || !formData.mrn) {
      setError("Please fill in all required fields")
      return
    }

    setError(null)

    if (editingPatient) {
      const result = await updateTestPatient(editingPatient.patient_id, {
        patient_name: formData.patient_name,
        mrn: formData.mrn,
        date_of_birth: formData.date_of_birth || null,
        description: formData.description || null,
        test_data_notes: formData.test_data_notes || null,
      })
      if (!result.success) {
        setError(result.error || "Failed to update patient")
        return
      }
    } else {
      const result = await createTestPatient({
        program_id: formData.program_id,
        patient_name: formData.patient_name,
        mrn: formData.mrn,
        date_of_birth: formData.date_of_birth || null,
        description: formData.description || null,
        test_data_notes: formData.test_data_notes || null,
      })
      if (!result.success) {
        setError(result.error || "Failed to create patient")
        return
      }
    }

    setShowModal(false)
    loadData()
  }

  const handleToggleActive = async (patient: TestPatientWithProgram) => {
    if (patient.is_active) {
      await deactivateTestPatient(patient.patient_id)
    } else {
      await reactivateTestPatient(patient.patient_id)
    }
    loadData()
  }

  const handleDelete = async (patientId: string) => {
    if (!confirm("Are you sure you want to delete this test patient?")) {
      return
    }
    const result = await deleteTestPatient(patientId)
    if (!result.success) {
      alert(result.error || "Failed to delete patient")
      return
    }
    loadData()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/uat"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Test Patients</h1>
          </div>
          <p className="text-muted-foreground">
            Manage pre-defined test patients for HIPAA-compliant UAT testing
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Test Patient
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-muted-foreground/30"
          />
          Show inactive patients
        </label>
      </div>

      {/* Patients List */}
      {patients.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No test patients</h3>
          <p className="mt-2 text-muted-foreground">
            Create test patients with synthetic data for UAT testing.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">Patient Name</th>
                <th className="text-left p-3 font-medium">MRN</th>
                <th className="text-left p-3 font-medium">Program</th>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.patient_id} className="border-t">
                  <td className="p-3 font-medium">{patient.patient_name}</td>
                  <td className="p-3 font-mono text-muted-foreground">{patient.mrn}</td>
                  <td className="p-3">{patient.program_name}</td>
                  <td className="p-3 max-w-xs truncate text-muted-foreground">
                    {patient.description || "-"}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        patient.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {patient.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenModal(patient)}
                        className="p-1.5 rounded hover:bg-muted"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(patient)}
                        className="p-1.5 rounded hover:bg-muted"
                        title={patient.is_active ? "Deactivate" : "Activate"}
                      >
                        {patient.is_active ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(patient.patient_id)}
                        className="p-1.5 rounded hover:bg-muted"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingPatient ? "Edit Test Patient" : "Add Test Patient"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Program <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                  disabled={!!editingPatient}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Patient Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    placeholder="e.g., Test Patient A"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    MRN <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.mrn}
                    onChange={(e) => setFormData({ ...formData, mrn: e.target.value })}
                    placeholder="e.g., TEST001"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What test scenario does this patient represent?"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Test Data Notes</label>
                <textarea
                  value={formData.test_data_notes}
                  onChange={(e) => setFormData({ ...formData, test_data_notes: e.target.value })}
                  placeholder="Notes about what test data exists for this patient..."
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {editingPatient ? "Save Changes" : "Create Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
