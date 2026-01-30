import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ServiceResult } from '../contracts'

type AcknowledgmentInsert = Database['public']['Tables']['tester_acknowledgments']['Insert']

export interface AcknowledgmentData {
  cycleId: string
  identityConfirmed: boolean
  hipaaAcknowledged: boolean
  testDataFilterAcknowledged: boolean
}

/**
 * Acknowledgment Service Implementation
 *
 * Handles HIPAA and identity acknowledgments for UAT testers.
 * Required for compliance before testers can access test data.
 */
export class AcknowledgmentService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Record a tester's acknowledgment for a cycle
   */
  async recordAcknowledgment(
    data: AcknowledgmentData,
    userId: string,
    ipAddress: string | null,
    userAgent: string | null
  ): Promise<ServiceResult> {
    // Verify user is a tester assigned to this cycle
    const { data: testerAssignment } = await this.supabase
      .from('cycle_testers')
      .select('id')
      .eq('cycle_id', data.cycleId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!testerAssignment) {
      return { success: false, error: 'You are not assigned to this cycle' }
    }

    // Validate all required acknowledgments
    if (!data.identityConfirmed) {
      return { success: false, error: 'You must confirm your identity' }
    }
    if (!data.hipaaAcknowledged) {
      return { success: false, error: 'You must acknowledge HIPAA test data requirements' }
    }
    if (!data.testDataFilterAcknowledged) {
      return { success: false, error: 'You must acknowledge you will use only approved test data' }
    }

    const now = new Date().toISOString()

    const insertData: AcknowledgmentInsert = {
      cycle_id: data.cycleId,
      user_id: userId,
      identity_confirmed_at: now,
      identity_method: 'checkbox',
      hipaa_acknowledged_at: now,
      test_data_filter_acknowledged: data.testDataFilterAcknowledged,
      ip_address: ipAddress,
      user_agent: userAgent,
    }

    const { error } = await this.supabase
      .from('tester_acknowledgments')
      .insert(insertData)

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You have already completed acknowledgment for this cycle' }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Get acknowledgment status for a user and cycle
   */
  async getAcknowledgmentStatus(
    cycleId: string,
    userId: string
  ): Promise<ServiceResult<{ hasAcknowledged: boolean; acknowledgment: unknown | null }>> {
    const { data: acknowledgment, error } = await this.supabase
      .from('tester_acknowledgments')
      .select('*')
      .eq('cycle_id', cycleId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" which is expected if not acknowledged
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        hasAcknowledged: !!acknowledgment,
        acknowledgment: acknowledgment || null,
      },
    }
  }

  /**
   * Check if user has access to a cycle and whether they need to acknowledge
   */
  async checkCycleAccess(
    cycleId: string,
    userId: string
  ): Promise<ServiceResult<{
    hasAccess: boolean
    needsAcknowledgment: boolean
    userId: string
  }>> {
    // Check if user is assigned to cycle
    const { data: testerAssignment } = await this.supabase
      .from('cycle_testers')
      .select('id, is_active')
      .eq('cycle_id', cycleId)
      .eq('user_id', userId)
      .single()

    if (!testerAssignment || !testerAssignment.is_active) {
      return {
        success: true,
        data: {
          hasAccess: false,
          needsAcknowledgment: false,
          userId,
        },
        error: 'You are not assigned to this cycle',
      }
    }

    // Check if user has acknowledged
    const { data: acknowledgment } = await this.supabase
      .from('tester_acknowledgments')
      .select('id')
      .eq('cycle_id', cycleId)
      .eq('user_id', userId)
      .single()

    return {
      success: true,
      data: {
        hasAccess: true,
        needsAcknowledgment: !acknowledgment,
        userId,
      },
    }
  }
}
