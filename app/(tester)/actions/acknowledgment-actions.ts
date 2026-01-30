"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { AcknowledgmentService } from "@/lib/services"

export interface AcknowledgmentFormData {
  cycleId: string
  identityConfirmed: boolean
  hipaaAcknowledged: boolean
  testDataFilterAcknowledged: boolean
}

/**
 * Record a tester's acknowledgment for a cycle
 */
export async function recordAcknowledgment(
  data: AcknowledgmentFormData,
  ipAddress: string | null,
  userAgent: string | null
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  const service = new AcknowledgmentService(supabase)
  const result = await service.recordAcknowledgment(data, userData.user_id, ipAddress, userAgent)

  if (result.success) {
    revalidatePath(`/tester/cycle/${data.cycleId}`)
    revalidatePath(`/acknowledge/${data.cycleId}`)
  }

  return result
}

/**
 * Get acknowledgment status for the current user and a cycle
 */
export async function getAcknowledgmentStatus(cycleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  const service = new AcknowledgmentService(supabase)
  const result = await service.getAcknowledgmentStatus(cycleId, userData.user_id)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return {
    success: true,
    hasAcknowledged: result.data?.hasAcknowledged ?? false,
    acknowledgment: result.data?.acknowledgment ?? null,
  }
}

/**
 * Check if current user has access to a cycle and needs acknowledgment
 */
export async function checkCycleAccess(cycleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated", hasAccess: false, needsAcknowledgment: false }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found", hasAccess: false, needsAcknowledgment: false }
  }

  const service = new AcknowledgmentService(supabase)
  const result = await service.checkCycleAccess(cycleId, userData.user_id)

  if (!result.success) {
    return {
      success: result.success,
      hasAccess: result.data?.hasAccess ?? false,
      needsAcknowledgment: result.data?.needsAcknowledgment ?? false,
      error: result.error,
    }
  }

  return {
    success: true,
    hasAccess: result.data?.hasAccess ?? false,
    needsAcknowledgment: result.data?.needsAcknowledgment ?? false,
    userId: result.data?.userId,
  }
}
