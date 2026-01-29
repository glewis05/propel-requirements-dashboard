"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Users, Trash2, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getCycleTesters,
  getAvailableTesters,
  addTesterToCycle,
  removeTesterFromCycle,
  updateTesterCapacity,
  type CycleTesterWithUser,
} from "../../tester-pool-actions"
import { getCycleById } from "../../cycle-actions"
import { cn } from "@/lib/utils"

interface PageParams {
  cycleId: string
}

export default function ManageTestersPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter()
  const [cycleId, setCycleId] = useState<string>("")
  const [cycle, setCycle] = useState<{ name: string; program_id: string; locked_at: string | null } | null>(null)
  const [testers, setTesters] = useState<CycleTesterWithUser[]>([])
  const [availableTesters, setAvailableTesters] = useState<{ user_id: string; name: string; email: string | null }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setCycleId(p.cycleId)
      loadData(p.cycleId)
    })
  }, [params])

  const loadData = async (id: string) => {
    setIsLoading(true)
    const [cycleResult, testersResult] = await Promise.all([
      getCycleById(id),
      getCycleTesters(id),
    ])

    if (cycleResult.success && cycleResult.cycle) {
      setCycle({
        name: cycleResult.cycle.name,
        program_id: cycleResult.cycle.program_id,
        locked_at: cycleResult.cycle.locked_at,
      })

      // Load available testers for the program
      const availableResult = await getAvailableTesters(cycleResult.cycle.program_id)
      if (availableResult.success) {
        setAvailableTesters(availableResult.testers || [])
      }
    }

    if (testersResult.success) {
      setTesters(testersResult.testers || [])
    }
    setIsLoading(false)
  }

  const handleAddTester = async (userId: string, capacity: number = 100) => {
    setError(null)
    const result = await addTesterToCycle(cycleId, userId, capacity)
    if (!result.success) {
      setError(result.error || "Failed to add tester")
      return
    }
    await loadData(cycleId)
    setShowAddModal(false)
  }

  const handleRemoveTester = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this tester from the cycle?")) {
      return
    }
    setError(null)
    const result = await removeTesterFromCycle(cycleId, userId)
    if (!result.success) {
      setError(result.error || "Failed to remove tester")
      return
    }
    await loadData(cycleId)
  }

  const handleUpdateCapacity = async (userId: string, capacity: number) => {
    setError(null)
    const result = await updateTesterCapacity(cycleId, userId, capacity)
    if (!result.success) {
      setError(result.error || "Failed to update capacity")
      return
    }
    await loadData(cycleId)
  }

  const assignedUserIds = new Set(testers.map(t => t.user_id))
  const unassignedTesters = availableTesters.filter(t => !assignedUserIds.has(t.user_id))

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
      <div>
        <Link
          href={`/uat/cycles/${cycleId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cycle
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manage Testers</h1>
            <p className="text-muted-foreground">{cycle?.name}</p>
          </div>
          {!cycle?.locked_at && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Tester
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {cycle?.locked_at && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          This cycle is locked. Tester assignments cannot be modified.
        </div>
      )}

      {/* Testers List */}
      {testers.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No testers assigned</h3>
          <p className="mt-2 text-muted-foreground">
            Add testers to this cycle to begin assigning tests.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">Tester</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-center p-3 font-medium">Capacity</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testers.map((tester) => (
                <tr key={tester.id} className="border-t">
                  <td className="p-3 font-medium">{tester.user_name}</td>
                  <td className="p-3 text-muted-foreground">{tester.user_email}</td>
                  <td className="p-3 text-center">
                    {cycle?.locked_at ? (
                      <span>{tester.capacity_weight}%</span>
                    ) : (
                      <select
                        value={tester.capacity_weight}
                        onChange={(e) => handleUpdateCapacity(tester.user_id, parseInt(e.target.value))}
                        className="rounded border bg-background px-2 py-1 text-sm"
                      >
                        <option value={25}>25%</option>
                        <option value={50}>50%</option>
                        <option value={75}>75%</option>
                        <option value={100}>100%</option>
                      </select>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        tester.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {tester.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {!cycle?.locked_at && (
                      <button
                        onClick={() => handleRemoveTester(tester.user_id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Tester Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Add Tester to Cycle</h2>

            {unassignedTesters.length === 0 ? (
              <p className="text-muted-foreground mb-4">
                All available testers have already been assigned to this cycle.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                {unassignedTesters.map((tester) => (
                  <button
                    key={tester.user_id}
                    onClick={() => handleAddTester(tester.user_id)}
                    className="w-full flex items-center justify-between p-3 rounded-md border hover:border-primary hover:bg-muted/50 text-left"
                  >
                    <div>
                      <p className="font-medium">{tester.name}</p>
                      <p className="text-sm text-muted-foreground">{tester.email}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
