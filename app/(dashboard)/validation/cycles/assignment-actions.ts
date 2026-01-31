"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database, DistributionMethod, ExecutionStatus, AssignmentType } from "@/types/database"

// Type aliases for table insert types
type TestExecutionInsert = Database['public']['Tables']['test_executions']['Insert']
type CrossValidationGroupInsert = Database['public']['Tables']['cross_validation_groups']['Insert']
type CycleAssignmentInsert = Database['public']['Tables']['cycle_assignments']['Insert']

// ============================================================================
// Assignment Algorithm Types
// ============================================================================

export interface AssignmentConfig {
  cycleId: string
  testCaseIds: string[]
  distributionMethod: DistributionMethod
  crossValidationEnabled: boolean
  crossValidationPercentage?: number
  validatorsPerTest?: number
  environment?: string
}

export interface AssignmentPreviewResult {
  totalTests: number
  primaryTests: number
  crossValidationTests: number
  testerAssignments: TesterAssignmentPreview[]
  crossValidationGroups: CrossValidationGroupPreview[]
}

export interface TesterAssignmentPreview {
  userId: string
  userName: string
  capacityWeight: number
  primaryCount: number
  crossValidationCount: number
  totalCount: number
}

export interface CrossValidationGroupPreview {
  testCaseId: string
  testCaseTitle: string
  assignedTesters: string[]
}

export interface ExecutionAssignment {
  testCaseId: string
  storyId: string
  assignedTo: string
  assignmentType: AssignmentType
  crossValidationGroupId?: string
}

// ============================================================================
// Assignment Algorithm Implementation
// ============================================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function distributePrimaryTests(
  testCases: { testCaseId: string; storyId: string }[],
  testers: { userId: string; capacityWeight: number }[],
  method: DistributionMethod
): Map<string, { testCaseId: string; storyId: string }[]> {
  const distribution = new Map<string, { testCaseId: string; storyId: string }[]>()

  // Initialize distribution map
  testers.forEach(t => distribution.set(t.userId, []))

  if (method === "equal") {
    // Round-robin distribution
    let testerIndex = 0
    for (const testCase of testCases) {
      const tester = testers[testerIndex]
      distribution.get(tester.userId)!.push(testCase)
      testerIndex = (testerIndex + 1) % testers.length
    }
  } else {
    // Weighted distribution
    const totalWeight = testers.reduce((sum, t) => sum + t.capacityWeight, 0)
    const testsPerWeight = testCases.length / totalWeight

    // Calculate target count for each tester
    const targets = testers.map(t => ({
      userId: t.userId,
      target: Math.round(t.capacityWeight * testsPerWeight),
      current: 0,
    }))

    // Distribute tests based on weighted targets
    for (const testCase of testCases) {
      // Find tester most below their target
      const tester = targets.reduce((best, current) => {
        const bestRatio = best.current / Math.max(best.target, 1)
        const currentRatio = current.current / Math.max(current.target, 1)
        return currentRatio < bestRatio ? current : best
      })

      distribution.get(tester.userId)!.push(testCase)
      tester.current++
    }
  }

  return distribution
}

function selectCrossValidationTests(
  testCases: { testCaseId: string; storyId: string }[],
  percentage: number
): { testCaseId: string; storyId: string }[] {
  const count = Math.round(testCases.length * (percentage / 100))
  const shuffled = shuffleArray(testCases)
  return shuffled.slice(0, count)
}

function assignCrossValidationTesters(
  cvTestCases: { testCaseId: string; storyId: string }[],
  testers: { userId: string; capacityWeight: number }[],
  validatorsPerTest: number,
  method: DistributionMethod
): Map<string, { testCaseId: string; storyId: string; testers: string[] }> {
  const cvGroups = new Map<string, { testCaseId: string; storyId: string; testers: string[] }>()

  // Track how many CV assignments each tester has
  const testerCvCounts = new Map<string, number>()
  testers.forEach(t => testerCvCounts.set(t.userId, 0))

  for (const testCase of cvTestCases) {
    // Sort testers by their current CV load (adjusted by weight if weighted)
    const sortedTesters = [...testers].sort((a, b) => {
      const aCount = testerCvCounts.get(a.userId) || 0
      const bCount = testerCvCounts.get(b.userId) || 0

      if (method === "weighted") {
        // Lower weighted ratio means they should get more
        const aRatio = aCount / a.capacityWeight
        const bRatio = bCount / b.capacityWeight
        return aRatio - bRatio
      }
      return aCount - bCount
    })

    // Take top N testers for this test
    const assignedTesters = sortedTesters
      .slice(0, Math.min(validatorsPerTest, testers.length))
      .map(t => t.userId)

    // Update counts
    assignedTesters.forEach(userId => {
      testerCvCounts.set(userId, (testerCvCounts.get(userId) || 0) + 1)
    })

    cvGroups.set(testCase.testCaseId, {
      testCaseId: testCase.testCaseId,
      storyId: testCase.storyId,
      testers: assignedTesters,
    })
  }

  return cvGroups
}

// ============================================================================
// Assignment Actions
// ============================================================================

export async function previewAssignment(config: AssignmentConfig): Promise<{
  success: boolean
  error?: string
  preview?: AssignmentPreviewResult
}> {
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

  if (!["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to create assignments" }
  }

  // Get cycle testers
  const { data: cycleTesters } = await supabase
    .from("cycle_testers")
    .select(`
      user_id,
      capacity_weight,
      users:user_id (name)
    `)
    .eq("cycle_id", config.cycleId)
    .eq("is_active", true)

  if (!cycleTesters || cycleTesters.length === 0) {
    return { success: false, error: "No active testers assigned to this cycle" }
  }

  const testers = cycleTesters.map(t => ({
    userId: t.user_id,
    userName: (t.users as Record<string, unknown>)?.name as string || "Unknown",
    capacityWeight: t.capacity_weight,
  }))

  // Get test case details
  const { data: testCases } = await supabase
    .from("test_cases")
    .select("test_case_id, story_id, title")
    .in("test_case_id", config.testCaseIds)

  if (!testCases || testCases.length === 0) {
    return { success: false, error: "No valid test cases provided" }
  }

  const testCaseMap = new Map(testCases.map(tc => [
    tc.test_case_id,
    { testCaseId: tc.test_case_id, storyId: tc.story_id, title: tc.title },
  ]))

  const allTestCases = config.testCaseIds
    .filter(id => testCaseMap.has(id))
    .map(id => testCaseMap.get(id)!)

  // Calculate cross-validation tests
  let cvTestCases: typeof allTestCases = []
  let primaryTestCases = allTestCases

  if (config.crossValidationEnabled && config.crossValidationPercentage && config.validatorsPerTest) {
    cvTestCases = selectCrossValidationTests(allTestCases, config.crossValidationPercentage)
    const cvTestCaseIds = new Set(cvTestCases.map(tc => tc.testCaseId))
    primaryTestCases = allTestCases.filter(tc => !cvTestCaseIds.has(tc.testCaseId))
  }

  // Distribute primary tests
  const primaryDistribution = distributePrimaryTests(
    primaryTestCases,
    testers.map(t => ({ userId: t.userId, capacityWeight: t.capacityWeight })),
    config.distributionMethod
  )

  // Assign cross-validation tests
  const cvGroups = config.crossValidationEnabled && cvTestCases.length > 0
    ? assignCrossValidationTesters(
        cvTestCases,
        testers.map(t => ({ userId: t.userId, capacityWeight: t.capacityWeight })),
        config.validatorsPerTest || 3,
        config.distributionMethod
      )
    : new Map()

  // Build preview result
  const testerAssignments: TesterAssignmentPreview[] = testers.map(t => {
    const primaryCount = primaryDistribution.get(t.userId)?.length || 0
    let cvCount = 0
    cvGroups.forEach(group => {
      if (group.testers.includes(t.userId)) cvCount++
    })

    return {
      userId: t.userId,
      userName: t.userName,
      capacityWeight: t.capacityWeight,
      primaryCount,
      crossValidationCount: cvCount,
      totalCount: primaryCount + cvCount,
    }
  })

  const crossValidationGroups: CrossValidationGroupPreview[] = []
  cvGroups.forEach(group => {
    const testCase = testCaseMap.get(group.testCaseId)
    crossValidationGroups.push({
      testCaseId: group.testCaseId,
      testCaseTitle: testCase?.title || "Unknown",
      assignedTesters: group.testers,
    })
  })

  return {
    success: true,
    preview: {
      totalTests: allTestCases.length,
      primaryTests: primaryTestCases.length,
      crossValidationTests: cvTestCases.length,
      testerAssignments,
      crossValidationGroups,
    },
  }
}

export async function executeAssignment(config: AssignmentConfig): Promise<{
  success: boolean
  error?: string
  executionCount?: number
}> {
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

  if (!["Admin", "Portfolio Manager", "Program Manager", "UAT Manager"].includes(userData.role || "")) {
    return { success: false, error: "You do not have permission to create assignments" }
  }

  // Check if cycle is locked
  const { data: cycle } = await supabase
    .from("uat_cycles")
    .select("locked_at, program_id")
    .eq("cycle_id", config.cycleId)
    .single()

  if (cycle?.locked_at) {
    return { success: false, error: "Cannot assign tests to a locked cycle" }
  }

  // Get cycle testers
  const { data: cycleTesters } = await supabase
    .from("cycle_testers")
    .select("user_id, capacity_weight")
    .eq("cycle_id", config.cycleId)
    .eq("is_active", true)

  if (!cycleTesters || cycleTesters.length === 0) {
    return { success: false, error: "No active testers assigned to this cycle" }
  }

  const testers = cycleTesters.map(t => ({
    userId: t.user_id,
    capacityWeight: t.capacity_weight,
  }))

  // Get test case details
  const { data: testCases } = await supabase
    .from("test_cases")
    .select("test_case_id, story_id")
    .in("test_case_id", config.testCaseIds)

  if (!testCases || testCases.length === 0) {
    return { success: false, error: "No valid test cases provided" }
  }

  const testCaseMap = new Map(testCases.map(tc => [
    tc.test_case_id,
    { testCaseId: tc.test_case_id, storyId: tc.story_id },
  ]))

  const allTestCases = config.testCaseIds
    .filter(id => testCaseMap.has(id))
    .map(id => testCaseMap.get(id)!)

  // Calculate distributions
  let cvTestCases: typeof allTestCases = []
  let primaryTestCases = allTestCases

  if (config.crossValidationEnabled && config.crossValidationPercentage && config.validatorsPerTest) {
    cvTestCases = selectCrossValidationTests(allTestCases, config.crossValidationPercentage)
    const cvTestCaseIds = new Set(cvTestCases.map(tc => tc.testCaseId))
    primaryTestCases = allTestCases.filter(tc => !cvTestCaseIds.has(tc.testCaseId))
  }

  const primaryDistribution = distributePrimaryTests(primaryTestCases, testers, config.distributionMethod)
  const cvGroups = config.crossValidationEnabled && cvTestCases.length > 0
    ? assignCrossValidationTesters(cvTestCases, testers, config.validatorsPerTest || 3, config.distributionMethod)
    : new Map()

  // Create executions and assignments
  const executions: TestExecutionInsert[] = []

  // Primary executions
  primaryDistribution.forEach((tests, userId) => {
    tests.forEach(test => {
      const execution: TestExecutionInsert = {
        test_case_id: test.testCaseId,
        story_id: test.storyId,
        assigned_to: userId,
        assigned_by: userData.user_id,
        status: "assigned",
        cycle_id: config.cycleId,
        environment: config.environment || null,
      }
      executions.push(execution)
    })
  })

  // Cross-validation executions
  cvGroups.forEach(group => {
    group.testers.forEach(userId => {
      const execution: TestExecutionInsert = {
        test_case_id: group.testCaseId,
        story_id: group.storyId,
        assigned_to: userId,
        assigned_by: userData.user_id,
        status: "assigned",
        cycle_id: config.cycleId,
        environment: config.environment || null,
      }
      executions.push(execution)
    })
  })

  // Insert executions
  const { data: createdExecutions, error: execError } = await supabase
    .from("test_executions")
    .insert(executions)
    .select("execution_id, test_case_id, assigned_to")

  if (execError) {
    console.error("Error creating executions:", execError)
    return { success: false, error: execError.message }
  }

  // Create cross-validation groups
  const cvGroupIds = new Map<string, string>()
  if (cvGroups.size > 0) {
    const cvGroupInserts: CrossValidationGroupInsert[] = Array.from(cvGroups.keys()).map(testCaseId => ({
      cycle_id: config.cycleId,
      test_case_id: testCaseId,
    }))

    const { data: createdCvGroups, error: cvError } = await supabase
      .from("cross_validation_groups")
      .insert(cvGroupInserts)
      .select("group_id, test_case_id")

    if (cvError) {
      console.error("Error creating CV groups:", cvError)
      // Continue anyway - assignments will work without CV groups
    } else if (createdCvGroups) {
      createdCvGroups.forEach(g => cvGroupIds.set(g.test_case_id, g.group_id))
    }
  }

  // Create cycle assignments
  const assignments: CycleAssignmentInsert[] = (createdExecutions || []).map(exec => {
    const isCv = cvGroups.has(exec.test_case_id)
    const assignment: CycleAssignmentInsert = {
      cycle_id: config.cycleId,
      execution_id: exec.execution_id,
      assignment_type: isCv ? "cross_validation" : "primary",
      cross_validation_group_id: isCv ? cvGroupIds.get(exec.test_case_id) || null : null,
      assigned_by: userData.user_id,
    }
    return assignment
  })

  const { error: assignError } = await supabase
    .from("cycle_assignments")
    .insert(assignments)

  if (assignError) {
    console.error("Error creating assignments:", assignError)
    // Don't fail - executions were created successfully
  }

  revalidatePath(`/validation/cycles/${config.cycleId}`)
  revalidatePath(`/validation/cycles/${config.cycleId}/assign`)
  revalidatePath("/validation/executions")

  return { success: true, executionCount: executions.length }
}

export async function getAssignmentDistribution(cycleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get workload from view
  const { data: workload, error } = await supabase
    .from("cycle_tester_workload")
    .select("*")
    .eq("cycle_id", cycleId)

  if (error) {
    console.error("Error fetching distribution:", error)
    return { success: false, error: error.message }
  }

  return { success: true, distribution: workload || [] }
}

export async function getCycleTestCases(cycleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get cycle's program
  const { data: cycle } = await supabase
    .from("uat_cycles")
    .select("program_id")
    .eq("cycle_id", cycleId)
    .single()

  if (!cycle) {
    return { success: false, error: "Cycle not found" }
  }

  // Get all test cases for the program that are ready
  const { data: testCases, error } = await supabase
    .from("test_cases")
    .select(`
      test_case_id,
      story_id,
      title,
      description,
      test_type,
      priority,
      status,
      user_stories:story_id (
        title,
        status
      )
    `)
    .eq("program_id", cycle.program_id)
    .eq("status", "ready")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching test cases:", error)
    return { success: false, error: error.message }
  }

  // Transform to include story title
  const transformedTestCases = (testCases || []).map(tc => ({
    ...tc,
    story_title: (tc.user_stories as Record<string, unknown>)?.title as string || "",
    story_status: (tc.user_stories as Record<string, unknown>)?.status as string || "",
    user_stories: undefined,
  }))

  return { success: true, testCases: transformedTestCases }
}

export async function getAlreadyAssignedTestCases(cycleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get test cases already assigned in this cycle
  const { data: assignments, error } = await supabase
    .from("cycle_assignments")
    .select("execution_id, test_executions:execution_id (test_case_id)")
    .eq("cycle_id", cycleId)

  if (error) {
    console.error("Error fetching assigned test cases:", error)
    return { success: false, error: error.message }
  }

  const testCaseIds = new Set(
    (assignments || [])
      .map(a => (a.test_executions as Record<string, unknown>)?.test_case_id as string)
      .filter(Boolean)
  )

  return { success: true, assignedTestCaseIds: Array.from(testCaseIds) }
}
