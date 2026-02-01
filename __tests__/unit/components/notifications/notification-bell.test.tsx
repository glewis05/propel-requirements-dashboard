import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationBell } from '@/components/notifications/notification-bell'
import * as notificationActions from '@/app/(dashboard)/notifications/actions'

// Mock the notification actions
vi.mock('@/app/(dashboard)/notifications/actions', () => ({
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}))

describe('NotificationBell', () => {
  const mockNotifications = [
    {
      id: 'notif-001',
      user_id: 'user-001',
      notification_type: 'mention' as const,
      title: 'You were mentioned',
      message: 'John mentioned you in Story ABC',
      story_id: 'story-001',
      is_read: false,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    },
    {
      id: 'notif-002',
      user_id: 'user-001',
      notification_type: 'status_change' as const,
      title: 'Status changed',
      message: 'Story XYZ moved to In Development',
      story_id: 'story-002',
      is_read: false,
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    },
    {
      id: 'notif-003',
      user_id: 'user-001',
      notification_type: 'approval_result' as const,
      title: 'Story approved',
      message: 'Your story was approved',
      story_id: 'story-003',
      is_read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(notificationActions.getNotifications).mockResolvedValue({
      success: true,
      notifications: mockNotifications,
      unreadCount: 2,
    })
    vi.mocked(notificationActions.markNotificationAsRead).mockResolvedValue({
      success: true,
    })
    vi.mocked(notificationActions.markAllNotificationsAsRead).mockResolvedValue({
      success: true,
    })
  })

  describe('rendering', () => {
    it('renders the bell button', async () => {
      render(<NotificationBell />)
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
    })

    it('shows unread count badge when there are unread notifications', async () => {
      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('shows 9+ when unread count exceeds 9', async () => {
      vi.mocked(notificationActions.getNotifications).mockResolvedValue({
        success: true,
        notifications: [],
        unreadCount: 15,
      })

      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByText('9+')).toBeInTheDocument()
      })
    })

    it('does not show badge when there are no unread notifications', async () => {
      vi.mocked(notificationActions.getNotifications).mockResolvedValue({
        success: true,
        notifications: mockNotifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      })

      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.queryByText('0')).not.toBeInTheDocument()
      })
    })
  })

  describe('dropdown', () => {
    it('opens dropdown when bell is clicked', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))

      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('You were mentioned')).toBeInTheDocument()
    })

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <NotificationBell />
        </div>
      )

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))
      expect(screen.getByText('You were mentioned')).toBeInTheDocument()

      await user.click(screen.getByTestId('outside'))

      await waitFor(() => {
        expect(screen.queryByText('You were mentioned')).not.toBeInTheDocument()
      })
    })

    it('closes dropdown when bell is clicked again', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))
      expect(screen.getByText('You were mentioned')).toBeInTheDocument()

      await user.click(screen.getByLabelText('Notifications'))

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Notifications' })).not.toBeInTheDocument()
      })
    })
  })

  describe('notification list', () => {
    it('shows loading state initially', async () => {
      // Make the promise hang
      vi.mocked(notificationActions.getNotifications).mockReturnValue(
        new Promise(() => {})
      )

      const user = userEvent.setup()
      render(<NotificationBell />)

      await user.click(screen.getByLabelText('Notifications'))

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows empty state when no notifications', async () => {
      vi.mocked(notificationActions.getNotifications).mockResolvedValue({
        success: true,
        notifications: [],
        unreadCount: 0,
      })

      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))

      expect(screen.getByText('No notifications')).toBeInTheDocument()
    })

    it('displays notification titles and messages', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))

      expect(screen.getByText('You were mentioned')).toBeInTheDocument()
      expect(screen.getByText('John mentioned you in Story ABC')).toBeInTheDocument()
      expect(screen.getByText('Status changed')).toBeInTheDocument()
    })

    it('shows relative time for notifications', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))

      // Should show "5m" for 5 minutes ago
      expect(screen.getByText('5m')).toBeInTheDocument()
    })

    it('highlights unread notifications', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))

      // Unread notifications have bg-primary/5 class
      const unreadItems = document.querySelectorAll('.bg-primary\\/5')
      expect(unreadItems.length).toBe(2)
    })
  })

  describe('mark as read', () => {
    it('marks notification as read when clicked', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))

      // Click on an unread notification
      const notificationItem = screen.getByText('You were mentioned').closest('a, div')
      if (notificationItem) {
        await user.click(notificationItem)
      }

      await waitFor(() => {
        expect(notificationActions.markNotificationAsRead).toHaveBeenCalledWith('notif-001')
      })
    })

    it('shows mark all read button when there are unread notifications', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))

      expect(screen.getByText('Mark all read')).toBeInTheDocument()
    })

    it('marks all as read when clicking mark all', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))
      await user.click(screen.getByText('Mark all read'))

      await waitFor(() => {
        expect(notificationActions.markAllNotificationsAsRead).toHaveBeenCalled()
      })
    })
  })

  describe('refresh', () => {
    it('shows refresh button in footer', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))

      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })

    it('reloads notifications when refresh is clicked', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))

      vi.clearAllMocks()
      await user.click(screen.getByText('Refresh'))

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('links', () => {
    it('renders notification with story_id as a link', async () => {
      const user = userEvent.setup()
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalled()
      })

      await user.click(screen.getByLabelText('Notifications'))

      const link = screen.getByText('You were mentioned').closest('a')
      expect(link).toHaveAttribute('href', '/stories/story-001')
    })
  })

  describe('polling', () => {
    it('loads notifications on mount', async () => {
      render(<NotificationBell />)

      await waitFor(() => {
        expect(notificationActions.getNotifications).toHaveBeenCalledWith(20)
      })
    })
  })
})
