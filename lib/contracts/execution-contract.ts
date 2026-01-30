import type { ExecutionStatus, StepResult } from '@/types/database'
import type { ServiceResult } from './story-contract'

/**
 * Test execution data
 */
export interface ExecutionData {
  execution_id: string
  test_case_id: string
  story_id: string
  assigned_to: string
  assigned_by: string
  assigned_at: string
  status: ExecutionStatus
  step_results: StepResult[]
  started_at: string | null
  completed_at: string | null
  verified_by: string | null
  verified_at: string | null
  cycle_id: string | null
  test_patient_id: string | null
  notes: string | null
}

/**
 * Execution summary for dashboards
 */
export interface ExecutionSummary {
  total: number
  passed: number
  failed: number
  blocked: number
  pending: number
  verified: number
}

/**
 * Execution Service Contract
 *
 * Defines operations for managing test executions.
 * Used by both dashboard (managers) and tester portal.
 */
export interface IExecutionService {
  /**
   * Get executions assigned to a user
   */
  getMyExecutions(userId: string): Promise<ServiceResult<ExecutionData[]>>

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): Promise<ServiceResult<ExecutionData>>

  /**
   * Start an execution
   */
  startExecution(
    executionId: string,
    userId: string
  ): Promise<ServiceResult>

  /**
   * Record a step result
   */
  recordStepResult(
    executionId: string,
    stepNumber: number,
    result: Omit<StepResult, 'step_number' | 'executed_at'>,
    userId: string
  ): Promise<ServiceResult>

  /**
   * Complete an execution
   */
  completeExecution(
    executionId: string,
    finalStatus: 'passed' | 'failed' | 'blocked',
    userId: string,
    notes?: string
  ): Promise<ServiceResult>

  /**
   * Get execution summary for a story or program
   */
  getSummary(filter: {
    storyId?: string
    programId?: string
    cycleId?: string
  }): Promise<ServiceResult<ExecutionSummary>>
}
