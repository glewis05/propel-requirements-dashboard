import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, NotificationType } from '@/types/database'
import type {
  INotificationService,
  NotificationData,
  ServiceResult,
} from '../contracts'

/**
 * Notification Service Implementation
 *
 * Handles in-app notifications and email notifications.
 * Used by both dashboard and tester portal.
 */
export class NotificationService implements INotificationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getUnread(userId: string): Promise<ServiceResult<NotificationData[]>> {
    const { data, error } = await this.supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as NotificationData[] }
  }

  async getAll(
    userId: string,
    limit = 50
  ): Promise<ServiceResult<NotificationData[]>> {
    const { data, error } = await this.supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as NotificationData[] }
  }

  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<ServiceResult> {
    const { error } = await this.supabase
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId) // Security: ensure user owns notification

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  async markAllAsRead(userId: string): Promise<ServiceResult> {
    const { error } = await this.supabase
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  async createNotification(params: {
    userId: string
    title: string
    message: string
    type: NotificationType
    storyId?: string
  }): Promise<ServiceResult<{ id: string }>> {
    // Use the database function for consistent notification creation
    const { data, error } = await this.supabase.rpc('create_notification', {
      p_user_id: params.userId,
      p_title: params.title,
      p_message: params.message,
      p_notification_type: params.type,
      p_story_id: params.storyId || null,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: { id: data as string } }
  }

  async sendEmail(params: {
    userId: string
    subject: string
    body: string
    storyId?: string
  }): Promise<ServiceResult> {
    // Get user's email and notification preferences
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('email, notification_preferences')
      .eq('user_id', params.userId)
      .single()

    if (userError || !user?.email) {
      return { success: false, error: 'User not found or no email' }
    }

    // Check if email notifications are enabled
    const prefs = user.notification_preferences as { email_enabled?: boolean } | null
    if (!prefs?.email_enabled) {
      return { success: true } // Silently skip if disabled
    }

    // Dynamic import to avoid loading email deps when not needed
    try {
      const { sendEmail } = await import('@/lib/notifications/email')
      await sendEmail({
        to: user.email,
        subject: params.subject,
        html: params.body,
      })
      return { success: true }
    } catch (error) {
      console.error('Failed to send email:', error)
      return { success: false, error: 'Failed to send email' }
    }
  }
}
