export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = "Portfolio Manager" | "Program Manager" | "Developer" | "Admin"

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

export interface NotificationPreferences {
  email_enabled: boolean
  status_changes: boolean
  comments: boolean
  approvals: boolean
  mentions: boolean
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
    }
  }
}
