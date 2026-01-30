import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, StepResult } from '@/types/database'
import type { ServiceResult } from '../contracts'

type ExecutionUpdate = Database['public']['Tables']['test_executions']['Update']

/**
 * Execution Service Implementation
 *
 * Handles test execution operations for both dashboard and tester portal.
 */
export class ExecutionService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get executions assigned to a user for a specific cycle
   */
  async getAssignedTests(
    userId: string,
    cycleId: string
  ): Promise<ServiceResult<unknown[]>> {
    const { data, error } = await this.supabase
      .from('tester_cycle_assignments')
      .select('*')
      .eq('cycle_id', cycleId)
      .eq('assigned_to', userId)
      .order('status', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  }

  /**
   * Select a test patient for an execution
   */
  async selectTestPatient(
    executionId: string,
    patientId: string,
    userId: string
  ): Promise<ServiceResult> {
    // Verify execution belongs to user
    const { data: execution } = await this.supabase
      .from('test_executions')
      .select('assigned_to, status')
      .eq('execution_id', executionId)
      .single()

    if (!execution) {
      return { success: false, error: 'Execution not found' }
    }

    if (execution.assigned_to !== userId) {
      return { success: false, error: 'You can only modify tests assigned to you' }
    }

    if (!['assigned', 'in_progress'].includes(execution.status)) {
      return { success: false, error: 'Test patient can only be selected for pending tests' }
    }

    const updateData: ExecutionUpdate = { test_patient_id: patientId }

    const { error } = await this.supabase
      .from('test_executions')
      .update(updateData)
      .eq('execution_id', executionId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Start a test execution
   */
  async startExecution(
    executionId: string,
    userId: string
  ): Promise<ServiceResult> {
    // Verify execution belongs to user
    const { data: execution } = await this.supabase
      .from('test_executions')
      .select('assigned_to, status, test_patient_id, cycle_id')
      .eq('execution_id', executionId)
      .single()

    if (!execution) {
      return { success: false, error: 'Execution not found' }
    }

    if (execution.assigned_to !== userId) {
      return { success: false, error: 'You can only start tests assigned to you' }
    }

    if (execution.status !== 'assigned') {
      return { success: false, error: 'Test has already been started' }
    }

    // Require test patient selection for cycle-based executions
    if (execution.cycle_id && !execution.test_patient_id) {
      return { success: false, error: 'Please select a test patient before starting' }
    }

    const startUpdate: ExecutionUpdate = {
      status: 'in_progress',
      started_at: new Date().toISOString(),
    }

    const { error } = await this.supabase
      .from('test_executions')
      .update(startUpdate)
      .eq('execution_id', executionId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Submit a step result
   */
  async submitStepResult(
    executionId: string,
    stepResult: Omit<StepResult, 'executed_at'>,
    userId: string
  ): Promise<ServiceResult> {
    // Fetch current execution
    const { data: execution } = await this.supabase
      .from('test_executions')
      .select('status, assigned_to, step_results')
      .eq('execution_id', executionId)
      .single()

    if (!execution) {
      return { success: false, error: 'Execution not found' }
    }

    if (execution.assigned_to !== userId) {
      return { success: false, error: 'You can only update tests assigned to you' }
    }

    if (execution.status !== 'in_progress') {
      return { success: false, error: 'Test must be in progress to update steps' }
    }

    // Update step results - merge with existing
    const existingResults = (execution.step_results as StepResult[] | null) || []
    const updatedResults = existingResults.filter(
      r => r.step_number !== stepResult.step_number
    )
    updatedResults.push({
      ...stepResult,
      executed_at: new Date().toISOString(),
    })
    updatedResults.sort((a, b) => a.step_number - b.step_number)

    const stepUpdate: ExecutionUpdate = {
      step_results: JSON.stringify(updatedResults),
    }

    const { error } = await this.supabase
      .from('test_executions')
      .update(stepUpdate)
      .eq('execution_id', executionId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Complete a test execution
   */
  async completeExecution(
    executionId: string,
    status: 'passed' | 'failed' | 'blocked',
    userId: string,
    notes?: string
  ): Promise<ServiceResult> {
    // Fetch current execution
    const { data: execution } = await this.supabase
      .from('test_executions')
      .select('status, assigned_to')
      .eq('execution_id', executionId)
      .single()

    if (!execution) {
      return { success: false, error: 'Execution not found' }
    }

    if (execution.assigned_to !== userId) {
      return { success: false, error: 'You can only complete tests assigned to you' }
    }

    if (execution.status !== 'in_progress') {
      return { success: false, error: 'Test must be in progress to complete' }
    }

    const completeUpdate: ExecutionUpdate = {
      status,
      completed_at: new Date().toISOString(),
      notes: notes || null,
    }

    const { error } = await this.supabase
      .from('test_executions')
      .update(completeUpdate)
      .eq('execution_id', executionId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Get execution details with related data
   */
  async getExecutionDetails(
    executionId: string,
    userId: string
  ): Promise<ServiceResult<unknown>> {
    const { data: execution, error } = await this.supabase
      .from('test_executions')
      .select(`
        *,
        test_cases:test_case_id (
          test_case_id,
          title,
          description,
          preconditions,
          test_data,
          test_steps,
          expected_results,
          test_type,
          priority
        ),
        user_stories:story_id (
          title,
          user_story,
          acceptance_criteria
        ),
        test_patients:test_patient_id (
          patient_id,
          patient_name,
          mrn,
          description
        )
      `)
      .eq('execution_id', executionId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Verify user has access
    if (execution.assigned_to !== userId) {
      return { success: false, error: 'You do not have access to this test' }
    }

    return { success: true, data: execution }
  }

  /**
   * Get cycle summary for a tester
   */
  async getTesterCycleSummary(
    cycleId: string,
    userId: string
  ): Promise<ServiceResult<{ cycle: unknown; workload: unknown }>> {
    // Get cycle info
    const { data: cycle, error: cycleError } = await this.supabase
      .from('uat_cycles')
      .select(`
        cycle_id,
        name,
        description,
        status,
        start_date,
        end_date,
        programs:program_id (name)
      `)
      .eq('cycle_id', cycleId)
      .single()

    if (cycleError) {
      return { success: false, error: cycleError.message }
    }

    // Get user's workload for this cycle
    const { data: workload } = await this.supabase
      .from('cycle_tester_workload')
      .select('*')
      .eq('cycle_id', cycleId)
      .eq('user_id', userId)
      .single()

    return {
      success: true,
      data: {
        cycle: {
          ...cycle,
          program_name: (cycle.programs as Record<string, unknown>)?.name || '',
        },
        workload: workload || {
          total_assigned: 0,
          not_started: 0,
          in_progress: 0,
          completed: 0,
          failed: 0,
          blocked: 0,
        },
      },
    }
  }
}
