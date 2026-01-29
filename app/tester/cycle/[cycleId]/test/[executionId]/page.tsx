import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { checkCycleAccess } from "@/app/tester/acknowledgment-actions"
import { getExecutionDetails } from "@/app/tester/tester-execution-actions"
import { getTestPatientsForExecution } from "@/app/(dashboard)/uat/test-patients/test-patient-actions"
import { TesterExecutionRunner } from "@/components/tester/TesterExecutionRunner"
import { TestPatientSelector } from "@/components/tester/TestPatientSelector"
import { InstructionsPanel } from "@/components/tester/InstructionsPanel"
import type { TestStep, StepResult } from "@/types/database"

interface TestExecutionPageProps {
  params: Promise<{ cycleId: string; executionId: string }>
}

export default async function TestExecutionPage({ params }: TestExecutionPageProps) {
  const { cycleId, executionId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/tester")
  }

  // Check cycle access
  const accessResult = await checkCycleAccess(cycleId)

  if (!accessResult.success || !accessResult.hasAccess) {
    notFound()
  }

  // Redirect to acknowledgment if needed
  if (accessResult.needsAcknowledgment) {
    redirect(`/tester/cycle/${cycleId}/acknowledge`)
  }

  // Get execution details
  const execResult = await getExecutionDetails(executionId)

  if (!execResult.success || !execResult.execution) {
    notFound()
  }

  const execution = execResult.execution
  const testCase = execution.test_cases as Record<string, unknown>
  const story = execution.user_stories as Record<string, unknown>
  const testPatient = execution.test_patients as Record<string, unknown> | null

  // Get available test patients for this program
  const { data: cycleData } = await supabase
    .from("uat_cycles")
    .select("program_id")
    .eq("cycle_id", cycleId)
    .single()

  const patientsResult = cycleData
    ? await getTestPatientsForExecution(cycleData.program_id)
    : { success: false, patients: [] }

  const patients = patientsResult.success ? patientsResult.patients || [] : []

  return (
    <div className="space-y-6">
      {/* Test Case Header */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {testCase?.title as string || "Test Case"}
            </h1>
            <p className="text-gray-500 mt-1">{story?.title as string || ""}</p>
          </div>
          <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {testCase?.test_type as string || "functional"}
          </span>
        </div>

        {testCase?.description && (
          <p className="text-gray-600">{testCase.description as string}</p>
        )}
      </div>

      {/* Test Patient Selector (only for pending tests) */}
      {["assigned", "in_progress"].includes(execution.status) && (
        <div className="bg-white rounded-xl border p-5">
          <TestPatientSelector
            executionId={executionId}
            patients={patients}
            selectedPatientId={execution.test_patient_id}
          />
        </div>
      )}

      {/* Instructions Panel */}
      <InstructionsPanel
        testData={testCase?.test_data as string | null}
        preconditions={testCase?.preconditions as string | null}
        testPatientNotes={testPatient?.description as string | null}
      />

      {/* Execution Runner */}
      <div className="bg-white rounded-xl border p-5">
        <TesterExecutionRunner
          executionId={executionId}
          cycleId={cycleId}
          testSteps={(testCase?.test_steps as TestStep[]) || []}
          stepResults={(execution.step_results as StepResult[]) || []}
          status={execution.status}
          hasTestPatient={!!execution.test_patient_id}
        />
      </div>

      {/* Story Context (collapsible) */}
      {story?.user_story && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-medium text-gray-900 mb-2">User Story Context</h3>
          <p className="text-sm text-gray-600">{story.user_story as string}</p>
          {story?.acceptance_criteria && (
            <div className="mt-3 pt-3 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Acceptance Criteria</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {story.acceptance_criteria as string}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
