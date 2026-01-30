import type { NotificationType } from '@/types/database'
import type { ServiceResult } from './story-contract'

/**
 * In-app notification data
 */
export interface NotificationData {
  id: string
  user_id: string
  title: string
  message: string
  notification_type: NotificationType
  story_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

/**
 * Notification Service Contract
 *
 * Defines operations for in-app and email notifications.
 */
export interface INotificationService {
  /**
   * Get unread notifications for a user
   */
  getUnread(userId: string): Promise<ServiceResult<NotificationData[]>>

  /**
   * Get all notifications for a user
   */
  getAll(userId: string, limit?: number): Promise<ServiceResult<NotificationData[]>>

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string, userId: string): Promise<ServiceResult>

  /**
   * Mark all as read for a user
   */
  markAllAsRead(userId: string): Promise<ServiceResult>

  /**
   * Create an in-app notification
   */
  createNotification(params: {
    userId: string
    title: string
    message: string
    type: NotificationType
    storyId?: string
  }): Promise<ServiceResult<{ id: string }>>

  /**
   * Send email notification (if enabled for user)
   */
  sendEmail(params: {
    userId: string
    subject: string
    body: string
    storyId?: string
  }): Promise<ServiceResult>
}
