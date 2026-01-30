import type { StoryStatus, UserRole } from '@/types/database'

/**
 * Story data for list views
 */
export interface StoryListItem {
  story_id: string
  title: string
  user_story: string | null
  status: StoryStatus
  priority: string | null
  category: string | null
  program_id: string
  roadmap_target: string | null
  updated_at: string
  deleted_at: string | null
}

/**
 * Full story data
 */
export interface StoryDetail extends StoryListItem {
  role: string | null
  capability: string | null
  benefit: string | null
  acceptance_criteria: string | null
  success_metrics: string | null
  internal_notes: string | null
  meeting_context: string | null
  client_feedback: string | null
  parent_story_id: string | null
  related_stories: string[] | null
  version: number
  created_at: string
  approved_at: string | null
  approved_by: string | null
  stakeholder_approved_at: string | null
  stakeholder_approved_by: string | null
}

/**
 * Result of a service operation
 */
export interface ServiceResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Story Service Contract
 *
 * Defines operations for managing user stories.
 * Implementations handle database access and business rules.
 */
export interface IStoryService {
  /**
   * Get all active (non-deleted) stories
   */
  getStories(filters?: {
    programId?: string
    status?: StoryStatus
    limit?: number
  }): Promise<ServiceResult<StoryListItem[]>>

  /**
   * Get a single story by ID
   */
  getStory(storyId: string): Promise<ServiceResult<StoryDetail>>

  /**
   * Transition story to a new status
   */
  transitionStatus(
    storyId: string,
    newStatus: StoryStatus,
    userId: string,
    userRole: UserRole,
    notes?: string
  ): Promise<ServiceResult<{ previousStatus: StoryStatus }>>

  /**
   * Soft-delete a story (must not be in protected status)
   */
  deleteStory(
    storyId: string,
    userId: string,
    userRole: UserRole,
    reason?: string
  ): Promise<ServiceResult>

  /**
   * Check if a story can be deleted
   */
  canDelete(storyId: string): Promise<ServiceResult<{
    canDelete: boolean
    reason?: string
  }>>
}
