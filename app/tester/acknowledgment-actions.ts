"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { IdentityMethod } from "@/types/database"

// ============================================================================
// Tester Acknowledgment Actions
// ============================================================================

export interface AcknowledgmentFormData {
  cycleId: string
  identityConfirmed: boolean
  hipaaAcknowledged: boolean
  testDataFilterAcknowledged: boolean
}

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
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found" }
  }

  // Verify user is a tester assigned to this cycle
  const { data: testerAssignment } = await supabase
    .from("cycle_testers")
    .select("id")
    .eq("cycle_id", data.cycleId)
    .eq("user_id", userData.user_id)
    .eq("is_active", true)
    .single()

  if (!testerAssignment) {
    return { success: false, error: "You are not assigned to this cycle" }
  }

  // Validate all required acknowledgments
  if (!data.identityConfirmed) {
    return { success: false, error: "You must confirm your identity" }
  }
  if (!data.hipaaAcknowledged) {
    return { success: false, error: "You must acknowledge HIPAA test data requirements" }
  }
  if (!data.testDataFilterAcknowledged) {
    return { success: false, error: "You must acknowledge you will use only approved test data" }
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from("tester_acknowledgments")
    .insert({
      cycle_id: data.cycleId,
      user_id: userData.user_id,
      identity_confirmed_at: now,
      identity_method: "checkbox" as IdentityMethod,
      hipaa_acknowledged_at: now,
      test_data_filter_acknowledged: data.testDataFilterAcknowledged,
      ip_address: ipAddress,
      user_agent: userAgent,
    } as never)

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "You have already completed acknowledgment for this cycle" }
    }
    console.error("Error recording acknowledgment:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/tester/cycle/${data.cycleId}`)
  return { success: true }
}

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

  const { data: acknowledgment, error } = await supabase
    .from("tester_acknowledgments")
    .select("*")
    .eq("cycle_id", cycleId)
    .eq("user_id", userData.user_id)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows found" which is expected if not acknowledged
    console.error("Error checking acknowledgment status:", error)
    return { success: false, error: error.message }
  }

  return {
    success: true,
    hasAcknowledged: !!acknowledgment,
    acknowledgment: acknowledgment || null,
  }
}

export async function checkCycleAccess(cycleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated", hasAccess: false, needsAcknowledgment: false }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("user_id, role")
    .eq("auth_id", user.id)
    .single()

  if (!userData) {
    return { success: false, error: "User not found", hasAccess: false, needsAcknowledgment: false }
  }

  // Check if user is assigned to cycle
  const { data: testerAssignment } = await supabase
    .from("cycle_testers")
    .select("id, is_active")
    .eq("cycle_id", cycleId)
    .eq("user_id", userData.user_id)
    .single()

  if (!testerAssignment || !testerAssignment.is_active) {
    return {
      success: true,
      hasAccess: false,
      needsAcknowledgment: false,
      error: "You are not assigned to this cycle",
    }
  }

  // Check if user has acknowledged
  const { data: acknowledgment } = await supabase
    .from("tester_acknowledgments")
    .select("id")
    .eq("cycle_id", cycleId)
    .eq("user_id", userData.user_id)
    .single()

  return {
    success: true,
    hasAccess: true,
    needsAcknowledgment: !acknowledgment,
    userId: userData.user_id,
  }
}
