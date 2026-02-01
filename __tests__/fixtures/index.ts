/**
 * Consolidated Test Fixtures
 * Re-exports all fixtures and provides additional test data
 */

export * from './uat-portal'

// ============================================================================
// ADDITIONAL FIXTURES
// ============================================================================

import { vi } from 'vitest'
import type { StoryStatus, UserRole, NotificationType, ComplianceStatus } from '@/types/database'

// Story fixtures with various statuses
export const mockStories = {
  draft: {
    story_id: 'story-draft-001',
    title: 'Draft Story',
    program_id: 'prog-001',
    status: 'Draft' as StoryStatus,
    priority: 'Should Have',
    story_type: 'user_story' as const,
    user_story: 'As a user, I want to view draft stories',
    acceptance_criteria: 'Given I am logged in, when I view stories, then I see drafts',
    created_at: '2025-01-29T10:00:00Z',
    updated_at: '2025-01-29T10:00:00Z',
    created_by: 'user-001',
  },
  inReview: {
    story_id: 'story-review-001',
    title: 'Story In Review',
    program_id: 'prog-001',
    status: 'Internal Review' as StoryStatus,
    priority: 'Must Have',
    story_type: 'user_story' as const,
    user_story: 'As a reviewer, I want to approve stories',
    acceptance_criteria: 'Given a story is submitted, when I review, then I can approve',
    created_at: '2025-01-28T10:00:00Z',
    updated_at: '2025-01-29T08:00:00Z',
    created_by: 'user-001',
  },
  approved: {
    story_id: 'story-approved-001',
    title: 'Approved Story',
    program_id: 'prog-001',
    status: 'Approved' as StoryStatus,
    priority: 'Must Have',
    story_type: 'user_story' as const,
    user_story: 'As a developer, I want to implement approved features',
    acceptance_criteria: 'Given approval, when I develop, then feature is built',
    created_at: '2025-01-27T10:00:00Z',
    updated_at: '2025-01-29T12:00:00Z',
    created_by: 'user-001',
  },
  inDevelopment: {
    story_id: 'story-dev-001',
    title: 'Story In Development',
    program_id: 'prog-001',
    status: 'In Development' as StoryStatus,
    priority: 'Should Have',
    story_type: 'user_story' as const,
    user_story: 'As a tester, I want to test developed features',
    acceptance_criteria: 'Given development is complete, when I test, then all tests pass',
    created_at: '2025-01-26T10:00:00Z',
    updated_at: '2025-01-29T14:00:00Z',
    created_by: 'user-001',
  },
  ruleUpdate: {
    story_id: 'story-rule-001',
    title: 'NCCN Rule Update',
    program_id: 'prog-001',
    status: 'Draft' as StoryStatus,
    priority: 'Must Have',
    story_type: 'rule_update' as const,
    user_story: null,
    role: 'Clinical Analyst',
    capability: 'update treatment guidelines',
    acceptance_criteria: 'Guidelines are updated per NCCN specification',
    created_at: '2025-01-29T10:00:00Z',
    updated_at: '2025-01-29T10:00:00Z',
    created_by: 'user-001',
  },
}

// Notification fixtures
export const mockNotifications = {
  unread: [
    {
      id: 'notif-001',
      user_id: 'user-001',
      notification_type: 'mention' as NotificationType,
      title: 'You were mentioned',
      message: 'John mentioned you in a comment on Story ABC',
      story_id: 'story-001',
      is_read: false,
      created_at: '2025-01-29T10:00:00Z',
    },
    {
      id: 'notif-002',
      user_id: 'user-001',
      notification_type: 'status_change' as NotificationType,
      title: 'Story status changed',
      message: 'Story XYZ was moved to In Development',
      story_id: 'story-002',
      is_read: false,
      created_at: '2025-01-29T09:00:00Z',
    },
  ],
  read: [
    {
      id: 'notif-003',
      user_id: 'user-001',
      notification_type: 'approval_result' as NotificationType,
      title: 'Story approved',
      message: 'Your story was approved by the portfolio manager',
      story_id: 'story-003',
      is_read: true,
      created_at: '2025-01-28T10:00:00Z',
    },
  ],
}

// Compliance fixtures
export const mockComplianceFrameworks = {
  CFR11: { code: 'CFR11', count: 5 },
  HIPAA: { code: 'HIPAA', count: 8 },
  HITRUST: { code: 'HITRUST', count: 3 },
  SOC2: { code: 'SOC2', count: 4 },
}

export const mockComplianceHistory = [
  {
    history_id: 'hist-001',
    mapping_id: 'map-001',
    action: 'created' as const,
    previous_status: null,
    new_status: 'not_started' as ComplianceStatus,
    change_reason: null,
    changed_by: 'user-001',
    changed_by_name: 'John Doe',
    changed_by_email: 'john@test.com',
    ip_address: '192.168.1.1',
    created_at: '2025-01-29T10:00:00Z',
  },
  {
    history_id: 'hist-002',
    mapping_id: 'map-001',
    action: 'updated' as const,
    previous_status: 'not_started' as ComplianceStatus,
    new_status: 'in_progress' as ComplianceStatus,
    change_reason: 'Started implementation',
    changed_by: 'user-002',
    changed_by_name: 'Jane Smith',
    changed_by_email: 'jane@test.com',
    ip_address: '192.168.1.2',
    created_at: '2025-01-29T12:00:00Z',
  },
  {
    history_id: 'hist-003',
    mapping_id: 'map-001',
    action: 'verified' as const,
    previous_status: 'implemented' as ComplianceStatus,
    new_status: 'verified' as ComplianceStatus,
    change_reason: 'Verified during audit',
    changed_by: 'user-001',
    changed_by_name: 'John Doe',
    changed_by_email: 'john@test.com',
    ip_address: '192.168.1.1',
    created_at: '2025-01-29T14:00:00Z',
  },
]

// User fixtures by role
export const mockUsersByRole: Record<UserRole, {
  user_id: string
  auth_id: string
  email: string
  name: string
  role: UserRole
}> = {
  Admin: {
    user_id: 'user-admin',
    auth_id: 'auth-admin',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'Admin',
  },
  'Portfolio Manager': {
    user_id: 'user-portfolio',
    auth_id: 'auth-portfolio',
    email: 'portfolio@test.com',
    name: 'Portfolio Manager',
    role: 'Portfolio Manager',
  },
  'Program Manager': {
    user_id: 'user-program',
    auth_id: 'auth-program',
    email: 'program@test.com',
    name: 'Program Manager',
    role: 'Program Manager',
  },
  Developer: {
    user_id: 'user-dev',
    auth_id: 'auth-dev',
    email: 'dev@test.com',
    name: 'Developer',
    role: 'Developer',
  },
  'UAT Manager': {
    user_id: 'user-uat-mgr',
    auth_id: 'auth-uat-mgr',
    email: 'uat-mgr@test.com',
    name: 'UAT Manager',
    role: 'UAT Manager',
  },
  'UAT Tester': {
    user_id: 'user-tester',
    auth_id: 'auth-tester',
    email: 'tester@test.com',
    name: 'UAT Tester',
    role: 'UAT Tester',
  },
}

// Comment thread fixtures
export const mockCommentThread = {
  parent: {
    comment_id: 'comment-parent',
    story_id: 'story-001',
    user_id: 'user-001',
    content: 'This is the main comment with a question.',
    parent_id: null,
    is_question: true,
    is_resolved: false,
    created_at: '2025-01-29T10:00:00Z',
    user_name: 'John Doe',
    user_email: 'john@test.com',
  },
  replies: [
    {
      comment_id: 'comment-reply-1',
      story_id: 'story-001',
      user_id: 'user-002',
      content: 'This is a reply to the question.',
      parent_id: 'comment-parent',
      is_question: false,
      is_resolved: false,
      created_at: '2025-01-29T11:00:00Z',
      user_name: 'Jane Smith',
      user_email: 'jane@test.com',
    },
    {
      comment_id: 'comment-reply-2',
      story_id: 'story-001',
      user_id: 'user-001',
      content: 'Thanks for the clarification! @[Jane Smith](user-002)',
      parent_id: 'comment-parent',
      is_question: false,
      is_resolved: false,
      created_at: '2025-01-29T12:00:00Z',
      user_name: 'John Doe',
      user_email: 'john@test.com',
    },
  ],
}

// Test case execution fixtures
export const mockExecutions = {
  passed: {
    execution_id: 'exec-001',
    test_case_id: 'tc-001',
    cycle_id: 'cycle-001',
    assigned_to: 'user-tester',
    status: 'passed' as const,
    executed_at: '2025-01-29T10:00:00Z',
    result_notes: 'All steps passed as expected',
    evidence_urls: ['https://example.com/screenshot1.png'],
  },
  failed: {
    execution_id: 'exec-002',
    test_case_id: 'tc-002',
    cycle_id: 'cycle-001',
    assigned_to: 'user-tester',
    status: 'failed' as const,
    executed_at: '2025-01-29T11:00:00Z',
    result_notes: 'Step 3 failed - button not visible',
    evidence_urls: ['https://example.com/failure.png'],
    defect_id: 'defect-001',
  },
  blocked: {
    execution_id: 'exec-003',
    test_case_id: 'tc-003',
    cycle_id: 'cycle-001',
    assigned_to: 'user-tester',
    status: 'blocked' as const,
    executed_at: null,
    result_notes: 'Blocked by defect-001',
    evidence_urls: [],
  },
}

// Defect fixtures
export const mockDefects = {
  open: {
    defect_id: 'defect-001',
    title: 'Button not visible on mobile',
    description: 'The submit button is cut off on mobile viewport',
    severity: 'high' as const,
    status: 'open' as const,
    story_id: 'story-001',
    execution_id: 'exec-002',
    reported_by: 'user-tester',
    assigned_to: 'user-dev',
    created_at: '2025-01-29T11:30:00Z',
  },
  fixed: {
    defect_id: 'defect-002',
    title: 'Validation error message unclear',
    description: 'Error message does not specify which field is invalid',
    severity: 'medium' as const,
    status: 'fixed' as const,
    story_id: 'story-001',
    execution_id: 'exec-001',
    reported_by: 'user-tester',
    assigned_to: 'user-dev',
    created_at: '2025-01-28T10:00:00Z',
    resolved_at: '2025-01-29T08:00:00Z',
  },
}

// ============================================================================
// MOCK ACTION HELPERS
// ============================================================================

export function createMockServerAction<T>(response: T) {
  return vi.fn().mockResolvedValue(response)
}

export function createMockServerActionError(error: string) {
  return vi.fn().mockResolvedValue({ success: false, error })
}

export function createMockServerActionSuccess<T>(data?: T) {
  return vi.fn().mockResolvedValue({ success: true, ...data })
}
