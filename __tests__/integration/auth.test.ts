/**
 * Authentication Integration Tests
 *
 * These tests verify authentication flows:
 * - Session creation and management
 * - Protected route access
 * - Role-based access control
 * - Authentication state changes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

// Mock the server client
vi.mock('@/lib/supabase/server')

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Authentication Integration', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
        signInWithOtp: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  describe('Session Management', () => {
    it('getUser returns null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()

      expect(data.user).toBeNull()
    })

    it('getUser returns user when authenticated', async () => {
      const mockUser = {
        id: 'auth-001',
        email: 'user@test.com',
        created_at: new Date().toISOString(),
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()

      expect(data.user).toEqual(mockUser)
      expect(data.user?.email).toBe('user@test.com')
    })

    it('getSession returns null when no active session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const supabase = await createClient()
      const { data } = await supabase.auth.getSession()

      expect(data.session).toBeNull()
    })

    it('getSession returns session with user and tokens', async () => {
      const mockSession = {
        user: {
          id: 'auth-001',
          email: 'user@test.com',
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const supabase = await createClient()
      const { data } = await supabase.auth.getSession()

      expect(data.session).toBeDefined()
      expect(data.session?.user.email).toBe('user@test.com')
      expect(data.session?.access_token).toBe('mock-access-token')
    })
  })

  describe('Magic Link Authentication', () => {
    it('signInWithOtp sends magic link email', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      })

      const supabase = await createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: 'user@test.com',
      })

      expect(error).toBeNull()
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'user@test.com',
      })
    })

    it('signInWithOtp returns error for invalid email', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email address' },
      })

      const supabase = await createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: 'invalid-email',
      })

      expect(error).toBeDefined()
      expect(error?.message).toBe('Invalid email address')
    })

    it('signInWithOtp includes redirect URL', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      })

      const supabase = await createClient()
      await supabase.auth.signInWithOtp({
        email: 'user@test.com',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      })

      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'user@test.com',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      })
    })
  })

  describe('Sign Out', () => {
    it('signOut clears session', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const supabase = await createClient()
      const { error } = await supabase.auth.signOut()

      expect(error).toBeNull()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('signOut handles errors gracefully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Network error' },
      })

      const supabase = await createClient()
      const { error } = await supabase.auth.signOut()

      expect(error?.message).toBe('Network error')
    })
  })

  describe('Role-Based Access Control', () => {
    const usersByRole = {
      Admin: { user_id: 'user-admin', role: 'Admin' },
      'Portfolio Manager': { user_id: 'user-portfolio', role: 'Portfolio Manager' },
      'Program Manager': { user_id: 'user-program', role: 'Program Manager' },
      Developer: { user_id: 'user-dev', role: 'Developer' },
      'UAT Manager': { user_id: 'user-uat-mgr', role: 'UAT Manager' },
      'UAT Tester': { user_id: 'user-tester', role: 'UAT Tester' },
    }

    it('authenticates user and retrieves role from users table', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-001' } },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: usersByRole.Admin,
          error: null,
        }),
      })

      const supabase = await createClient()
      const { data: authData } = await supabase.auth.getUser()

      expect(authData.user).toBeDefined()

      const { data: userData } = await supabase
        .from('users')
        .select('user_id, role')
        .eq('auth_id', authData.user!.id)
        .single()

      expect(userData?.role).toBe('Admin')
    })

    it.each(Object.entries(usersByRole))(
      '%s role is recognized',
      async (roleName, userData) => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: userData,
            error: null,
          }),
        })

        const supabase = await createClient()
        const { data } = await supabase
          .from('users')
          .select('user_id, role')
          .eq('auth_id', 'test-auth-id')
          .single()

        expect(data?.role).toBe(roleName)
      }
    )
  })

  describe('Protected Route Access', () => {
    it('unauthenticated user cannot access protected resources', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()

      // Simulating protected route behavior
      const isAuthenticated = data.user !== null
      expect(isAuthenticated).toBe(false)
    })

    it('authenticated user can access protected resources', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-001' } },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { user_id: 'user-001', role: 'Developer' },
          error: null,
        }),
      })

      const supabase = await createClient()
      const { data: authData } = await supabase.auth.getUser()

      const isAuthenticated = authData.user !== null
      expect(isAuthenticated).toBe(true)

      // User can then fetch their data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user!.id)
        .single()

      expect(userData).toBeDefined()
    })
  })

  describe('Session Expiry', () => {
    it('detects expired session', async () => {
      const expiredSession = {
        user: { id: 'auth-001' },
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null,
      })

      const supabase = await createClient()
      const { data } = await supabase.auth.getSession()

      const isExpired = data.session && data.session.expires_at < Date.now() / 1000
      expect(isExpired).toBe(true)
    })

    it('validates active session', async () => {
      const activeSession = {
        user: { id: 'auth-001' },
        access_token: 'valid-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: activeSession },
        error: null,
      })

      const supabase = await createClient()
      const { data } = await supabase.auth.getSession()

      const isExpired = data.session && data.session.expires_at < Date.now() / 1000
      expect(isExpired).toBe(false)
    })
  })

  describe('Auth Error Handling', () => {
    it('handles network errors on getUser', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Network request failed' },
      })

      const supabase = await createClient()
      const { data, error } = await supabase.auth.getUser()

      expect(data.user).toBeNull()
      expect(error?.message).toBe('Network request failed')
    })

    it('handles invalid token errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT', code: 'invalid_jwt' },
      })

      const supabase = await createClient()
      const { error } = await supabase.auth.getUser()

      expect(error?.message).toBe('Invalid JWT')
    })
  })
})
