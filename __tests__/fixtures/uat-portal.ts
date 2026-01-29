/**
 * Test fixtures for UAT Tester Portal tests
 */

// Mock Users
export const mockUsers = {
  admin: {
    user_id: 'user-admin-001',
    auth_id: 'auth-admin-001',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'Admin',
  },
  manager: {
    user_id: 'user-mgr-001',
    auth_id: 'auth-mgr-001',
    email: 'manager@test.com',
    name: 'UAT Manager',
    role: 'UAT Manager',
  },
  tester1: {
    user_id: 'user-tester-001',
    auth_id: 'auth-tester-001',
    email: 'tester1@test.com',
    name: 'Tester One',
    role: 'UAT Tester',
  },
  tester2: {
    user_id: 'user-tester-002',
    auth_id: 'auth-tester-002',
    email: 'tester2@test.com',
    name: 'Tester Two',
    role: 'UAT Tester',
  },
  tester3: {
    user_id: 'user-tester-003',
    auth_id: 'auth-tester-003',
    email: 'tester3@test.com',
    name: 'Tester Three',
    role: 'UAT Tester',
  },
  tester4: {
    user_id: 'user-tester-004',
    auth_id: 'auth-tester-004',
    email: 'tester4@test.com',
    name: 'Tester Four',
    role: 'UAT Tester',
  },
  tester5: {
    user_id: 'user-tester-005',
    auth_id: 'auth-tester-005',
    email: 'tester5@test.com',
    name: 'Tester Five',
    role: 'UAT Tester',
  },
}

// Mock Program
export const mockProgram = {
  program_id: 'prog-test-001',
  name: 'Test Program',
  status: 'Active',
}

// Mock UAT Cycle
export const mockCycle = {
  cycle_id: 'cycle-test-001',
  name: 'Test UAT Cycle',
  description: 'A test cycle for unit testing',
  program_id: 'prog-test-001',
  status: 'draft',
  distribution_method: 'equal',
  cross_validation_enabled: true,
  cross_validation_percentage: 20,
  validators_per_test: 3,
  start_date: '2025-02-01',
  end_date: '2025-02-28',
  locked_at: null,
  locked_by: null,
  created_at: '2025-01-29T00:00:00Z',
  updated_at: '2025-01-29T00:00:00Z',
  created_by: 'user-mgr-001',
}

// Mock Cycle Testers
export const mockCycleTesters = [
  { cycle_id: 'cycle-test-001', user_id: 'user-tester-001', capacity_weight: 100, is_active: true },
  { cycle_id: 'cycle-test-001', user_id: 'user-tester-002', capacity_weight: 100, is_active: true },
  { cycle_id: 'cycle-test-001', user_id: 'user-tester-003', capacity_weight: 50, is_active: true },
  { cycle_id: 'cycle-test-001', user_id: 'user-tester-004', capacity_weight: 100, is_active: true },
  { cycle_id: 'cycle-test-001', user_id: 'user-tester-005', capacity_weight: 75, is_active: true },
]

// Mock Test Cases (generate array of test cases)
export function generateMockTestCases(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    test_case_id: `tc-${String(i + 1).padStart(3, '0')}`,
    story_id: `story-${String(Math.floor(i / 5) + 1).padStart(3, '0')}`,
    title: `Test Case ${i + 1}`,
    description: `Description for test case ${i + 1}`,
    test_type: i % 3 === 0 ? 'functional' : i % 3 === 1 ? 'regression' : 'smoke',
    priority: i % 4 === 0 ? 'critical' : i % 4 === 1 ? 'high' : i % 4 === 2 ? 'medium' : 'low',
    status: 'active',
    test_steps: [
      { step_number: 1, action: 'Step 1 action', expected_result: 'Expected result 1' },
      { step_number: 2, action: 'Step 2 action', expected_result: 'Expected result 2' },
    ],
  }))
}

// Mock Test Patients
export const mockTestPatients = [
  {
    patient_id: 'patient-001',
    program_id: 'prog-test-001',
    patient_name: 'Test Patient Alpha',
    mrn: 'MRN-TEST-001',
    date_of_birth: '1980-01-15',
    description: 'Standard test patient for smoke tests',
    test_data_notes: 'Has complete demographic data',
    is_active: true,
  },
  {
    patient_id: 'patient-002',
    program_id: 'prog-test-001',
    patient_name: 'Test Patient Beta',
    mrn: 'MRN-TEST-002',
    date_of_birth: '1975-06-20',
    description: 'Test patient with multiple conditions',
    test_data_notes: 'Has chronic conditions flagged',
    is_active: true,
  },
]

// Mock Acknowledgment
export const mockAcknowledgment = {
  id: 'ack-001',
  cycle_id: 'cycle-test-001',
  user_id: 'user-tester-001',
  identity_confirmed_at: '2025-01-29T10:00:00Z',
  identity_method: 'checkbox',
  hipaa_acknowledged_at: '2025-01-29T10:00:00Z',
  test_data_filter_acknowledged: true,
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  created_at: '2025-01-29T10:00:00Z',
}

// Helper to create mock Supabase response
export function mockSupabaseResponse<T>(data: T, error: Error | null = null) {
  return { data, error }
}

// Helper to create mock Supabase query builder
export function createMockQueryBuilder<T>(finalData: T) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: finalData, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: finalData, error: null }),
    then: vi.fn().mockResolvedValue({ data: finalData, error: null }),
  }
  return builder
}

// Import vi for mock functions
import { vi } from 'vitest'
