export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = "Portfolio Manager" | "Program Manager" | "Developer" | "Admin" | "UAT Manager" | "UAT Tester"

export type StoryType = "user_story" | "rule_update"

export type StoryStatus =
  | "Draft"
  | "Internal Review"
  | "Pending Client Review"
  | "Approved"
  | "In Development"
  | "In UAT"
  | "Needs Discussion"
  | "Out of Scope"

export type ApprovalType = "internal_review" | "stakeholder" | "portfolio"

export type ApprovalStatus = "approved" | "rejected" | "needs_discussion"

export type ActivityType =
  | "story_created"
  | "story_updated"
  | "story_deleted"
  | "status_changed"
  | "comment_added"
  | "comment_resolved"
  | "question_asked"
  | "question_answered"
  | "approval_granted"
  | "approval_rejected"
  | "story_linked"
  | "story_unlinked"
  | "test_case_created"
  | "test_case_generated"
  | "test_assigned"
  | "test_started"
  | "test_completed"
  | "defect_reported"
  | "defect_resolved"

export type NotificationType =
  | "mention"
  | "reply"
  | "status_change"
  | "approval_needed"
  | "approval_result"
  | "question_answered"
  | "assigned"
  | "test_assigned"
  | "defect_reported"
  | "execution_complete"
  | "test_case_generated"

export type RequirementCategory =
  | "Functional"
  | "Non-Functional"
  | "System"
  | "Interface"
  | "Performance"
  | "Security"
  | "Compliance"
  | "Usability"

export type RequirementStatus =
  | "Draft"
  | "Under Review"
  | "Approved"
  | "Implemented"
  | "Verified"
  | "Deprecated"

export type CoverageType = "full" | "partial" | "derived"

// UAT Types
export type TestCaseStatus = "draft" | "ready" | "in_progress" | "completed" | "deprecated"

export type ExecutionStatus = "assigned" | "in_progress" | "passed" | "failed" | "blocked" | "verified"

export type DefectSeverity = "critical" | "high" | "medium" | "low"

export type DefectStatus = "open" | "confirmed" | "in_progress" | "fixed" | "verified" | "closed"

export type TestType = "functional" | "regression" | "integration" | "smoke" | "boundary" | "security" | "accessibility"

// UAT Cycle Types
export type CycleStatus = "draft" | "active" | "completed" | "archived"

export type DistributionMethod = "equal" | "weighted"

// Compliance types
export type ComplianceStatus =
  | "not_applicable"
  | "not_started"
  | "planned"
  | "in_progress"
  | "implemented"
  | "verified"
  | "deferred"

export type RequirementLevel = "required" | "addressable" | "recommended"

export type AssignmentType = "primary" | "cross_validation"

export type IdentityMethod = "checkbox" | "signature"

export interface TestStep {
  step_number: number
  action: string
  expected_result: string
  notes?: string
}

export interface StepResult {
  step_number: number
  status: "passed" | "failed" | "blocked" | "skipped"
  actual_result: string
  notes?: string
  executed_at: string
}

export interface NotificationPreferences {
  email_enabled: boolean
  status_changes: boolean
  comments: boolean
  approvals: boolean
  mentions: boolean
}

// UAT Cycle Interfaces
export interface UATCycle {
  cycle_id: string
  name: string
  description: string | null
  program_id: string
  status: CycleStatus
  distribution_method: DistributionMethod
  cross_validation_enabled: boolean
  cross_validation_percentage: number | null
  validators_per_test: number | null
  start_date: string | null
  end_date: string | null
  locked_at: string | null
  locked_by: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export interface CycleTester {
  id: string
  cycle_id: string
  user_id: string
  capacity_weight: number
  is_active: boolean
  added_at: string
  added_by: string
}

export interface TestPatient {
  patient_id: string
  program_id: string
  patient_name: string
  mrn: string
  date_of_birth: string | null
  description: string | null
  test_data_notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export interface TesterAcknowledgment {
  id: string
  cycle_id: string
  user_id: string
  identity_confirmed_at: string
  identity_method: IdentityMethod
  hipaa_acknowledged_at: string
  test_data_filter_acknowledged: boolean
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface CycleAssignment {
  id: string
  cycle_id: string
  execution_id: string
  assignment_type: AssignmentType
  cross_validation_group_id: string | null
  assigned_at: string
  assigned_by: string
}

export interface CrossValidationGroup {
  group_id: string
  cycle_id: string
  test_case_id: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: string
          name: string
          email: string | null
          organization: string
          is_business_associate: boolean
          status: string
          notes: string | null
          created_at: string
          updated_at: string
          role: UserRole | null
          assigned_programs: string[] | null
          avatar_url: string | null
          last_login_at: string | null
          auth_id: string | null
          notification_preferences: NotificationPreferences | null
        }
        Insert: {
          user_id: string
          name: string
          email?: string | null
          organization?: string
          is_business_associate?: boolean
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          role?: UserRole | null
          assigned_programs?: string[] | null
          avatar_url?: string | null
          last_login_at?: string | null
          auth_id?: string | null
          notification_preferences?: NotificationPreferences | null
        }
        Update: {
          user_id?: string
          name?: string
          email?: string | null
          organization?: string
          is_business_associate?: boolean
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          role?: UserRole | null
          assigned_programs?: string[] | null
          avatar_url?: string | null
          last_login_at?: string | null
          auth_id?: string | null
          notification_preferences?: NotificationPreferences | null
        }
      }
      user_stories: {
        Row: {
          story_id: string
          requirement_id: string | null
          program_id: string
          parent_story_id: string | null
          title: string
          user_story: string | null
          role: string | null
          capability: string | null
          benefit: string | null
          acceptance_criteria: string | null
          success_metrics: string | null
          priority: string | null
          category: string | null
          category_full: string | null
          is_technical: boolean
          status: StoryStatus
          internal_notes: string | null
          meeting_context: string | null
          client_feedback: string | null
          related_stories: Json | null
          flags: Json | null
          roadmap_target: string | null
          version: number
          created_at: string
          updated_at: string
          approved_at: string | null
          approved_by: string | null
          draft_date: string | null
          internal_review_date: string | null
          client_review_date: string | null
          needs_discussion_date: string | null
          stakeholder_approved_by: string | null
          stakeholder_approved_at: string | null
          locked_by: string | null
          locked_at: string | null
          test_cases_auto_generated_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          story_type: StoryType
        }
        Insert: {
          story_id: string
          requirement_id?: string | null
          program_id: string
          parent_story_id?: string | null
          title: string
          user_story?: string | null
          role?: string | null
          capability?: string | null
          benefit?: string | null
          acceptance_criteria?: string | null
          success_metrics?: string | null
          priority?: string | null
          category?: string | null
          category_full?: string | null
          is_technical?: boolean
          status?: StoryStatus
          internal_notes?: string | null
          meeting_context?: string | null
          client_feedback?: string | null
          related_stories?: Json | null
          flags?: Json | null
          roadmap_target?: string | null
          version?: number
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
          draft_date?: string | null
          internal_review_date?: string | null
          client_review_date?: string | null
          needs_discussion_date?: string | null
          stakeholder_approved_by?: string | null
          stakeholder_approved_at?: string | null
          locked_by?: string | null
          locked_at?: string | null
          test_cases_auto_generated_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          story_type?: StoryType
        }
        Update: {
          story_id?: string
          requirement_id?: string | null
          program_id?: string
          parent_story_id?: string | null
          title?: string
          user_story?: string | null
          role?: string | null
          capability?: string | null
          benefit?: string | null
          acceptance_criteria?: string | null
          success_metrics?: string | null
          priority?: string | null
          category?: string | null
          category_full?: string | null
          is_technical?: boolean
          status?: StoryStatus
          internal_notes?: string | null
          meeting_context?: string | null
          client_feedback?: string | null
          related_stories?: Json | null
          flags?: Json | null
          roadmap_target?: string | null
          version?: number
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
          draft_date?: string | null
          internal_review_date?: string | null
          client_review_date?: string | null
          needs_discussion_date?: string | null
          stakeholder_approved_by?: string | null
          stakeholder_approved_at?: string | null
          locked_by?: string | null
          locked_at?: string | null
          test_cases_auto_generated_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          story_type?: StoryType
        }
      }
      story_comments: {
        Row: {
          id: string
          story_id: string
          user_id: string
          parent_comment_id: string | null
          content: string
          is_question: boolean
          resolved: boolean
          accepted_answer: boolean
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          parent_comment_id?: string | null
          content: string
          is_question?: boolean
          resolved?: boolean
          accepted_answer?: boolean
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          parent_comment_id?: string | null
          content?: string
          is_question?: boolean
          resolved?: boolean
          accepted_answer?: boolean
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      story_approvals: {
        Row: {
          id: string
          story_id: string
          approved_by: string
          approval_type: ApprovalType
          status: ApprovalStatus
          previous_status: string | null
          notes: string | null
          approved_at: string
          ip_address: string | null
          session_id: string | null
        }
        Insert: {
          id?: string
          story_id: string
          approved_by: string
          approval_type: ApprovalType
          status: ApprovalStatus
          previous_status?: string | null
          notes?: string | null
          approved_at?: string
          ip_address?: string | null
          session_id?: string | null
        }
        Update: {
          id?: string
          story_id?: string
          approved_by?: string
          approval_type?: ApprovalType
          status?: ApprovalStatus
          previous_status?: string | null
          notes?: string | null
          approved_at?: string
          ip_address?: string | null
          session_id?: string | null
        }
      }
      story_versions: {
        Row: {
          id: string
          story_id: string
          version_number: number
          snapshot: Json
          changed_fields: string[] | null
          change_summary: string | null
          changed_by: string
          changed_at: string
          is_baseline: boolean
          baseline_name: string | null
        }
        Insert: {
          id?: string
          story_id: string
          version_number: number
          snapshot: Json
          changed_fields?: string[] | null
          change_summary?: string | null
          changed_by: string
          changed_at?: string
          is_baseline?: boolean
          baseline_name?: string | null
        }
        Update: {
          id?: string
          story_id?: string
          version_number?: number
          snapshot?: Json
          changed_fields?: string[] | null
          change_summary?: string | null
          changed_by?: string
          changed_at?: string
          is_baseline?: boolean
          baseline_name?: string | null
        }
      }
      programs: {
        Row: {
          program_id: string
          name: string
          prefix: string | null
          description: string | null
          client_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          program_id: string
          name: string
          prefix?: string | null
          description?: string | null
          client_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          program_id?: string
          name?: string
          prefix?: string | null
          description?: string | null
          client_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          activity_type: ActivityType
          user_id: string
          story_id: string | null
          comment_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          activity_type: ActivityType
          user_id: string
          story_id?: string | null
          comment_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          activity_type?: ActivityType
          user_id?: string
          story_id?: string | null
          comment_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      user_notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          notification_type: NotificationType
          story_id: string | null
          comment_id: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          notification_type: NotificationType
          story_id?: string | null
          comment_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          notification_type?: NotificationType
          story_id?: string | null
          comment_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      requirements: {
        Row: {
          id: string
          requirement_id: string
          dis_number: string | null
          title: string
          description: string | null
          category: RequirementCategory | null
          priority: string | null
          source: string | null
          program_id: string | null
          status: RequirementStatus
          regulatory_reference: string | null
          is_critical: boolean
          created_at: string
          updated_at: string
          approved_at: string | null
          approved_by: string | null
        }
        Insert: {
          id?: string
          requirement_id: string
          dis_number?: string | null
          title: string
          description?: string | null
          category?: RequirementCategory | null
          priority?: string | null
          source?: string | null
          program_id?: string | null
          status?: RequirementStatus
          regulatory_reference?: string | null
          is_critical?: boolean
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
        }
        Update: {
          id?: string
          requirement_id?: string
          dis_number?: string | null
          title?: string
          description?: string | null
          category?: RequirementCategory | null
          priority?: string | null
          source?: string | null
          program_id?: string | null
          status?: RequirementStatus
          regulatory_reference?: string | null
          is_critical?: boolean
          created_at?: string
          updated_at?: string
          approved_at?: string | null
          approved_by?: string | null
        }
      }
      requirement_story_mapping: {
        Row: {
          id: string
          requirement_id: string
          story_id: string
          coverage_type: CoverageType
          coverage_notes: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          requirement_id: string
          story_id: string
          coverage_type?: CoverageType
          coverage_notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          requirement_id?: string
          story_id?: string
          coverage_type?: CoverageType
          coverage_notes?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      test_cases: {
        Row: {
          test_case_id: string
          story_id: string
          program_id: string
          title: string
          description: string | null
          preconditions: string | null
          test_data: string | null
          test_steps: Json
          expected_results: string | null
          test_type: string
          priority: string
          is_ai_generated: boolean
          ai_model_used: string | null
          human_reviewed: boolean
          reviewed_by: string | null
          reviewed_at: string | null
          status: TestCaseStatus
          version: number
          created_at: string
          updated_at: string
          created_by: string
          is_archived: boolean
        }
        Insert: {
          test_case_id?: string
          story_id: string
          program_id: string
          title: string
          description?: string | null
          preconditions?: string | null
          test_data?: string | null
          test_steps?: Json
          expected_results?: string | null
          test_type?: string
          priority?: string
          is_ai_generated?: boolean
          ai_model_used?: string | null
          human_reviewed?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          status?: TestCaseStatus
          version?: number
          created_at?: string
          updated_at?: string
          created_by: string
          is_archived?: boolean
        }
        Update: {
          test_case_id?: string
          story_id?: string
          program_id?: string
          title?: string
          description?: string | null
          preconditions?: string | null
          test_data?: string | null
          test_steps?: Json
          expected_results?: string | null
          test_type?: string
          priority?: string
          is_ai_generated?: boolean
          ai_model_used?: string | null
          human_reviewed?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          status?: TestCaseStatus
          version?: number
          created_at?: string
          updated_at?: string
          created_by?: string
          is_archived?: boolean
        }
      }
      test_executions: {
        Row: {
          execution_id: string
          test_case_id: string
          story_id: string
          assigned_to: string
          assigned_by: string
          assigned_at: string
          status: ExecutionStatus
          step_results: Json
          started_at: string | null
          completed_at: string | null
          verified_by: string | null
          verified_at: string | null
          environment: string | null
          browser_device: string | null
          cycle_name: string | null
          cycle_id: string | null
          test_patient_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          execution_id?: string
          test_case_id: string
          story_id: string
          assigned_to: string
          assigned_by: string
          assigned_at?: string
          status?: ExecutionStatus
          step_results?: Json
          started_at?: string | null
          completed_at?: string | null
          verified_by?: string | null
          verified_at?: string | null
          environment?: string | null
          browser_device?: string | null
          cycle_name?: string | null
          cycle_id?: string | null
          test_patient_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          execution_id?: string
          test_case_id?: string
          story_id?: string
          assigned_to?: string
          assigned_by?: string
          assigned_at?: string
          status?: ExecutionStatus
          step_results?: Json
          started_at?: string | null
          completed_at?: string | null
          verified_by?: string | null
          verified_at?: string | null
          environment?: string | null
          browser_device?: string | null
          cycle_name?: string | null
          cycle_id?: string | null
          test_patient_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      defects: {
        Row: {
          defect_id: string
          execution_id: string | null
          test_case_id: string | null
          story_id: string
          program_id: string
          title: string
          description: string | null
          steps_to_reproduce: string | null
          expected_behavior: string | null
          actual_behavior: string | null
          severity: DefectSeverity
          status: DefectStatus
          reported_by: string
          assigned_to: string | null
          resolved_by: string | null
          resolved_at: string | null
          attachments: Json
          environment: string | null
          failed_step_number: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          defect_id?: string
          execution_id?: string | null
          test_case_id?: string | null
          story_id: string
          program_id: string
          title: string
          description?: string | null
          steps_to_reproduce?: string | null
          expected_behavior?: string | null
          actual_behavior?: string | null
          severity?: DefectSeverity
          status?: DefectStatus
          reported_by: string
          assigned_to?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          attachments?: Json
          environment?: string | null
          failed_step_number?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          defect_id?: string
          execution_id?: string | null
          test_case_id?: string | null
          story_id?: string
          program_id?: string
          title?: string
          description?: string | null
          steps_to_reproduce?: string | null
          expected_behavior?: string | null
          actual_behavior?: string | null
          severity?: DefectSeverity
          status?: DefectStatus
          reported_by?: string
          assigned_to?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          attachments?: Json
          environment?: string | null
          failed_step_number?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      uat_cycles: {
        Row: {
          cycle_id: string
          name: string
          description: string | null
          program_id: string
          status: CycleStatus
          distribution_method: DistributionMethod
          cross_validation_enabled: boolean
          cross_validation_percentage: number | null
          validators_per_test: number | null
          start_date: string | null
          end_date: string | null
          locked_at: string | null
          locked_by: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          cycle_id?: string
          name: string
          description?: string | null
          program_id: string
          status?: CycleStatus
          distribution_method?: DistributionMethod
          cross_validation_enabled?: boolean
          cross_validation_percentage?: number | null
          validators_per_test?: number | null
          start_date?: string | null
          end_date?: string | null
          locked_at?: string | null
          locked_by?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          cycle_id?: string
          name?: string
          description?: string | null
          program_id?: string
          status?: CycleStatus
          distribution_method?: DistributionMethod
          cross_validation_enabled?: boolean
          cross_validation_percentage?: number | null
          validators_per_test?: number | null
          start_date?: string | null
          end_date?: string | null
          locked_at?: string | null
          locked_by?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      cycle_testers: {
        Row: {
          id: string
          cycle_id: string
          user_id: string
          capacity_weight: number
          is_active: boolean
          added_at: string
          added_by: string
        }
        Insert: {
          id?: string
          cycle_id: string
          user_id: string
          capacity_weight?: number
          is_active?: boolean
          added_at?: string
          added_by: string
        }
        Update: {
          id?: string
          cycle_id?: string
          user_id?: string
          capacity_weight?: number
          is_active?: boolean
          added_at?: string
          added_by?: string
        }
      }
      test_patients: {
        Row: {
          patient_id: string
          program_id: string
          patient_name: string
          mrn: string
          date_of_birth: string | null
          description: string | null
          test_data_notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          patient_id?: string
          program_id: string
          patient_name: string
          mrn: string
          date_of_birth?: string | null
          description?: string | null
          test_data_notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          patient_id?: string
          program_id?: string
          patient_name?: string
          mrn?: string
          date_of_birth?: string | null
          description?: string | null
          test_data_notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      tester_acknowledgments: {
        Row: {
          id: string
          cycle_id: string
          user_id: string
          identity_confirmed_at: string
          identity_method: IdentityMethod
          hipaa_acknowledged_at: string
          test_data_filter_acknowledged: boolean
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cycle_id: string
          user_id: string
          identity_confirmed_at: string
          identity_method?: IdentityMethod
          hipaa_acknowledged_at: string
          test_data_filter_acknowledged?: boolean
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string
          user_id?: string
          identity_confirmed_at?: string
          identity_method?: IdentityMethod
          hipaa_acknowledged_at?: string
          test_data_filter_acknowledged?: boolean
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      cycle_assignments: {
        Row: {
          id: string
          cycle_id: string
          execution_id: string
          assignment_type: AssignmentType
          cross_validation_group_id: string | null
          assigned_at: string
          assigned_by: string
        }
        Insert: {
          id?: string
          cycle_id: string
          execution_id: string
          assignment_type?: AssignmentType
          cross_validation_group_id?: string | null
          assigned_at?: string
          assigned_by: string
        }
        Update: {
          id?: string
          cycle_id?: string
          execution_id?: string
          assignment_type?: AssignmentType
          cross_validation_group_id?: string | null
          assigned_at?: string
          assigned_by?: string
        }
      }
      cross_validation_groups: {
        Row: {
          group_id: string
          cycle_id: string
          test_case_id: string
          created_at: string
        }
        Insert: {
          group_id?: string
          cycle_id: string
          test_case_id: string
          created_at?: string
        }
        Update: {
          group_id?: string
          cycle_id?: string
          test_case_id?: string
          created_at?: string
        }
      }
      compliance_frameworks: {
        Row: {
          framework_id: string
          code: string
          name: string
          description: string | null
          version: string | null
          regulatory_body: string | null
          effective_date: string | null
          is_active: boolean
          display_order: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          framework_id?: string
          code: string
          name: string
          description?: string | null
          version?: string | null
          regulatory_body?: string | null
          effective_date?: string | null
          is_active?: boolean
          display_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          framework_id?: string
          code?: string
          name?: string
          description?: string | null
          version?: string | null
          regulatory_body?: string | null
          effective_date?: string | null
          is_active?: boolean
          display_order?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      compliance_controls: {
        Row: {
          control_id: string
          framework_id: string
          control_code: string
          title: string
          description: string | null
          category: string | null
          subcategory: string | null
          requirement_type: string | null
          is_critical: boolean
          applicability_criteria: Json | null
          guidance_notes: string | null
          evidence_requirements: string | null
          display_order: number
          parent_control_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          control_id?: string
          framework_id: string
          control_code: string
          title: string
          description?: string | null
          category?: string | null
          subcategory?: string | null
          requirement_type?: string | null
          is_critical?: boolean
          applicability_criteria?: Json | null
          guidance_notes?: string | null
          evidence_requirements?: string | null
          display_order?: number
          parent_control_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          control_id?: string
          framework_id?: string
          control_code?: string
          title?: string
          description?: string | null
          category?: string | null
          subcategory?: string | null
          requirement_type?: string | null
          is_critical?: boolean
          applicability_criteria?: Json | null
          guidance_notes?: string | null
          evidence_requirements?: string | null
          display_order?: number
          parent_control_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      story_compliance_mappings: {
        Row: {
          mapping_id: string
          story_id: string
          control_id: string
          status: string
          implementation_notes: string | null
          evidence_links: Json
          target_date: string | null
          verified_at: string | null
          verified_by: string | null
          verification_notes: string | null
          risk_assessment: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          mapping_id?: string
          story_id: string
          control_id: string
          status?: string
          implementation_notes?: string | null
          evidence_links?: Json
          target_date?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verification_notes?: string | null
          risk_assessment?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          mapping_id?: string
          story_id?: string
          control_id?: string
          status?: string
          implementation_notes?: string | null
          evidence_links?: Json
          target_date?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verification_notes?: string | null
          risk_assessment?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      compliance_mapping_history: {
        Row: {
          history_id: string
          mapping_id: string
          story_id: string
          control_id: string
          action: string
          previous_status: string | null
          new_status: string | null
          previous_data: Json | null
          new_data: Json | null
          change_reason: string | null
          changed_by: string
          changed_by_name: string | null
          changed_by_email: string | null
          ip_address: string | null
          user_agent: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          history_id?: string
          mapping_id: string
          story_id: string
          control_id: string
          action: string
          previous_status?: string | null
          new_status?: string | null
          previous_data?: Json | null
          new_data?: Json | null
          change_reason?: string | null
          changed_by: string
          changed_by_name?: string | null
          changed_by_email?: string | null
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          history_id?: string
          mapping_id?: string
          story_id?: string
          control_id?: string
          action?: string
          previous_status?: string | null
          new_status?: string | null
          previous_data?: Json | null
          new_data?: Json | null
          change_reason?: string | null
          changed_by?: string
          changed_by_name?: string | null
          changed_by_email?: string | null
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          created_at?: string
        }
      }
      program_compliance_settings: {
        Row: {
          id: string
          program_id: string
          framework_id: string
          is_enabled: boolean
          effective_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          program_id: string
          framework_id: string
          is_enabled?: boolean
          effective_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          program_id?: string
          framework_id?: string
          is_enabled?: boolean
          effective_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      compliance_reports: {
        Row: {
          report_id: string
          program_id: string | null
          framework_id: string | null
          report_type: string
          title: string
          description: string | null
          report_data: Json
          file_url: string | null
          generated_at: string
          generated_by: string
          parameters: Json | null
          is_archived: boolean
          archived_at: string | null
          archived_by: string | null
        }
        Insert: {
          report_id?: string
          program_id?: string | null
          framework_id?: string | null
          report_type: string
          title: string
          description?: string | null
          report_data: Json
          file_url?: string | null
          generated_at?: string
          generated_by: string
          parameters?: Json | null
          is_archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
        }
        Update: {
          report_id?: string
          program_id?: string | null
          framework_id?: string | null
          report_type?: string
          title?: string
          description?: string | null
          report_data?: Json
          file_url?: string | null
          generated_at?: string
          generated_by?: string
          parameters?: Json | null
          is_archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
        }
      }
    }
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      get_user_programs: {
        Args: Record<string, never>
        Returns: string[]
      }
      can_access_story: {
        Args: { p_story_id: string }
        Returns: boolean
      }
      acquire_story_lock: {
        Args: { p_story_id: string }
        Returns: boolean
      }
      release_story_lock: {
        Args: { p_story_id: string }
        Returns: void
      }
      is_story_locked: {
        Args: { p_story_id: string }
        Returns: {
          is_locked: boolean
          locked_by_name: string
          locked_since: string
        }[]
      }
      log_activity: {
        Args: {
          p_activity_type: string
          p_user_id: string
          p_story_id?: string
          p_comment_id?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_notification_type: string
          p_story_id?: string
          p_comment_id?: string
        }
        Returns: string
      }
      has_cycle_acknowledgment: {
        Args: {
          p_cycle_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      get_cv_agreement_status: {
        Args: {
          p_group_id: string
        }
        Returns: {
          group_id: string
          test_case_id: string
          total_testers: number
          completed_count: number
          passed_count: number
          failed_count: number
          blocked_count: number
          has_agreement: boolean
        }[]
      }
      get_compliance_summary: {
        Args: {
          p_program_id?: string
        }
        Returns: {
          framework_code: string
          framework_name: string
          total_controls: number
          critical_controls: number
          stories_mapped: number
          verified_count: number
          implemented_count: number
          completion_percentage: number
        }[]
      }
    }
  }
}
