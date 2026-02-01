/**
 * Test Utilities for PropelRequirements Dashboard
 * Provides common testing helpers, render functions, and mock factories
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { StoryStatus, UserRole, NotificationType } from '@/types/database'

// ============================================================================
// CUSTOM RENDER
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup()

  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
  }

  return {
    user,
    ...render(ui, { wrapper: AllProviders, ...options }),
  }
}

export { customRender as render }

// ============================================================================
// MOCK FACTORIES
// ============================================================================

// Counter for generating unique IDs
let mockIdCounter = 0

export function resetMockIds() {
  mockIdCounter = 0
}

export function generateMockId(prefix: string = 'mock'): string {
  return `${prefix}-${++mockIdCounter}`
}

// Mock User
export interface MockUser {
  user_id: string
  auth_id: string
  email: string
  name: string
  role: UserRole
  status: string
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const id = generateMockId('user')
  return {
    user_id: id,
    auth_id: `auth-${id}`,
    email: `${id}@test.com`,
    name: `Test User ${mockIdCounter}`,
    role: 'Developer',
    status: 'Active',
    ...overrides,
  }
}

// Mock Story
export interface MockStory {
  story_id: string
  title: string
  program_id: string
  status: StoryStatus
  priority: string | null
  story_type: 'user_story' | 'rule_update'
  user_story: string | null
  role: string | null
  capability: string | null
  benefit: string | null
  acceptance_criteria: string | null
  success_metrics: string | null
  category: string | null
  is_technical: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export function createMockStory(overrides: Partial<MockStory> = {}): MockStory {
  const id = generateMockId('story')
  return {
    story_id: id,
    title: `Test Story ${mockIdCounter}`,
    program_id: 'prog-001',
    status: 'Draft',
    priority: 'Should Have',
    story_type: 'user_story',
    user_story: 'As a user, I want to test, so that I can verify',
    role: null,
    capability: null,
    benefit: null,
    acceptance_criteria: 'Given X, when Y, then Z',
    success_metrics: null,
    category: null,
    is_technical: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-001',
    ...overrides,
  }
}

// Mock Notification
export interface MockNotification {
  id: string
  user_id: string
  notification_type: NotificationType
  title: string
  message: string
  story_id: string | null
  is_read: boolean
  created_at: string
}

export function createMockNotification(overrides: Partial<MockNotification> = {}): MockNotification {
  const id = generateMockId('notif')
  return {
    id,
    user_id: 'user-001',
    notification_type: 'mention',
    title: `Test Notification ${mockIdCounter}`,
    message: 'This is a test notification message',
    story_id: 'story-001',
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// Mock Program
export interface MockProgram {
  program_id: string
  name: string
  description: string | null
  status: string
}

export function createMockProgram(overrides: Partial<MockProgram> = {}): MockProgram {
  const id = generateMockId('prog')
  return {
    program_id: id,
    name: `Test Program ${mockIdCounter}`,
    description: 'A test program',
    status: 'Active',
    ...overrides,
  }
}

// Mock Comment
export interface MockComment {
  comment_id: string
  story_id: string
  user_id: string
  content: string
  parent_id: string | null
  is_question: boolean
  is_resolved: boolean
  created_at: string
  user_name?: string
  user_email?: string
}

export function createMockComment(overrides: Partial<MockComment> = {}): MockComment {
  const id = generateMockId('comment')
  return {
    comment_id: id,
    story_id: 'story-001',
    user_id: 'user-001',
    content: 'This is a test comment',
    parent_id: null,
    is_question: false,
    is_resolved: false,
    created_at: new Date().toISOString(),
    user_name: 'Test User',
    user_email: 'test@test.com',
    ...overrides,
  }
}

// Mock Test Case
export interface MockTestCase {
  test_case_id: string
  story_id: string
  title: string
  description: string | null
  test_type: string
  priority: string
  status: string
  test_steps: Array<{ step_number: number; action: string; expected_result: string }>
}

export function createMockTestCase(overrides: Partial<MockTestCase> = {}): MockTestCase {
  const id = generateMockId('tc')
  return {
    test_case_id: id,
    story_id: 'story-001',
    title: `Test Case ${mockIdCounter}`,
    description: 'A test case description',
    test_type: 'functional',
    priority: 'high',
    status: 'ready',
    test_steps: [
      { step_number: 1, action: 'Step 1', expected_result: 'Result 1' },
      { step_number: 2, action: 'Step 2', expected_result: 'Result 2' },
    ],
    ...overrides,
  }
}

// Mock UAT Cycle
export interface MockUATCycle {
  cycle_id: string
  name: string
  description: string | null
  program_id: string
  status: string
  distribution_method: string
  cross_validation_enabled: boolean
  cross_validation_percentage: number
  start_date: string
  end_date: string
  created_at: string
}

export function createMockUATCycle(overrides: Partial<MockUATCycle> = {}): MockUATCycle {
  const id = generateMockId('cycle')
  return {
    cycle_id: id,
    name: `UAT Cycle ${mockIdCounter}`,
    description: 'A test UAT cycle',
    program_id: 'prog-001',
    status: 'draft',
    distribution_method: 'equal',
    cross_validation_enabled: true,
    cross_validation_percentage: 20,
    start_date: '2025-02-01',
    end_date: '2025-02-28',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// Mock Compliance Mapping
export interface MockComplianceMapping {
  mapping_id: string
  story_id: string
  control_id: string
  framework_code: string
  status: string
  implementation_notes: string | null
  target_date: string | null
  verified_at: string | null
  verified_by: string | null
}

export function createMockComplianceMapping(overrides: Partial<MockComplianceMapping> = {}): MockComplianceMapping {
  const id = generateMockId('mapping')
  return {
    mapping_id: id,
    story_id: 'story-001',
    control_id: 'ctrl-001',
    framework_code: 'CFR11',
    status: 'not_started',
    implementation_notes: null,
    target_date: null,
    verified_at: null,
    verified_by: null,
    ...overrides,
  }
}

// Mock Compliance History Entry
export interface MockComplianceHistory {
  history_id: string
  mapping_id: string
  action: 'created' | 'updated' | 'verified' | 'deleted'
  previous_status: string | null
  new_status: string | null
  change_reason: string | null
  changed_by: string
  changed_by_name: string | null
  changed_by_email: string | null
  ip_address: string | null
  created_at: string
}

export function createMockComplianceHistory(overrides: Partial<MockComplianceHistory> = {}): MockComplianceHistory {
  const id = generateMockId('history')
  return {
    history_id: id,
    mapping_id: 'mapping-001',
    action: 'created',
    previous_status: null,
    new_status: 'not_started',
    change_reason: null,
    changed_by: 'user-001',
    changed_by_name: 'Test User',
    changed_by_email: 'test@test.com',
    ip_address: '192.168.1.1',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// ============================================================================
// SUPABASE MOCK HELPERS
// ============================================================================

export interface MockSupabaseQueryBuilder {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  neq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  is: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
}

export function createMockSupabaseClient<T>(data: T, error: Error | null = null) {
  const mockResponse = { data, error }

  const builder: MockSupabaseQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(mockResponse),
    maybeSingle: vi.fn().mockResolvedValue(mockResponse),
  }

  // Make the builder itself resolve to the mock response
  Object.assign(builder, {
    then: (resolve: (value: typeof mockResponse) => void) => {
      resolve(mockResponse)
      return builder
    },
  })

  return {
    from: vi.fn().mockReturnValue(builder),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    }),
    builder,
  }
}

// ============================================================================
// WAIT UTILITIES
// ============================================================================

export function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export function waitForMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export function expectToBeInDocument(element: HTMLElement | null) {
  if (!element) {
    throw new Error('Expected element to be in document, but it was null')
  }
  expect(element).toBeInTheDocument()
}

export function expectNotToBeInDocument(element: HTMLElement | null) {
  expect(element).not.toBeInTheDocument()
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export * from '@testing-library/react'
export { userEvent }
