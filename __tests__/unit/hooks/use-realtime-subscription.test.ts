import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase client
vi.mock('@/lib/supabase/client')

describe('useRealtimeSubscription', () => {
  let mockChannel: {
    on: ReturnType<typeof vi.fn>
    subscribe: ReturnType<typeof vi.fn>
    unsubscribe: ReturnType<typeof vi.fn>
  }
  let mockSupabase: {
    channel: ReturnType<typeof vi.fn>
  }
  let subscribeCallback: ((status: string, error?: Error) => void) | null = null

  beforeEach(() => {
    subscribeCallback = null

    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        subscribeCallback = callback
        return mockChannel
      }),
      unsubscribe: vi.fn(),
    }

    mockSupabase = {
      channel: vi.fn().mockReturnValue(mockChannel),
    }

    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('returns initial state', () => {
      const { result } = renderHook(() =>
        useRealtimeSubscription({ table: 'stories' })
      )

      expect(result.current.isConnected).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('creates a channel with table name', () => {
      renderHook(() => useRealtimeSubscription({ table: 'stories' }))

      expect(mockSupabase.channel).toHaveBeenCalledWith('stories-all-changes')
    })

    it('creates a channel with filter in name', () => {
      renderHook(() =>
        useRealtimeSubscription({
          table: 'stories',
          filter: 'program_id=eq.prog-001',
        })
      )

      // The filter replaces non-alphanumeric chars with hyphens
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        'stories-program-id-eq-prog-001'
      )
    })
  })

  describe('subscription setup', () => {
    it('subscribes to postgres_changes', () => {
      renderHook(() => useRealtimeSubscription({ table: 'stories' }))

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'stories',
        }),
        expect.any(Function)
      )
    })

    it('uses custom schema when provided', () => {
      renderHook(() =>
        useRealtimeSubscription({ table: 'stories', schema: 'custom' })
      )

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          schema: 'custom',
        }),
        expect.any(Function)
      )
    })

    it('uses custom event when provided', () => {
      renderHook(() =>
        useRealtimeSubscription({ table: 'stories', event: 'INSERT' })
      )

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
        }),
        expect.any(Function)
      )
    })

    it('uses filter when provided', () => {
      renderHook(() =>
        useRealtimeSubscription({
          table: 'stories',
          filter: 'program_id=eq.prog-001',
        })
      )

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          filter: 'program_id=eq.prog-001',
        }),
        expect.any(Function)
      )
    })

    it('calls subscribe on the channel', () => {
      renderHook(() => useRealtimeSubscription({ table: 'stories' }))

      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })

  describe('connection status', () => {
    it('sets isConnected to true on SUBSCRIBED', async () => {
      const { result } = renderHook(() =>
        useRealtimeSubscription({ table: 'stories' })
      )

      expect(result.current.isConnected).toBe(false)

      act(() => {
        subscribeCallback?.('SUBSCRIBED')
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
        expect(result.current.error).toBeNull()
      })
    })

    it('sets isConnected to false on CLOSED', async () => {
      const { result } = renderHook(() =>
        useRealtimeSubscription({ table: 'stories' })
      )

      act(() => {
        subscribeCallback?.('SUBSCRIBED')
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      act(() => {
        subscribeCallback?.('CLOSED')
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false)
      })
    })

    it('sets error on CHANNEL_ERROR', async () => {
      const { result } = renderHook(() =>
        useRealtimeSubscription({ table: 'stories' })
      )

      const testError = new Error('Connection failed')

      act(() => {
        subscribeCallback?.('CHANNEL_ERROR', testError)
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false)
        expect(result.current.error).toBe(testError)
      })
    })

    it('creates default error on CHANNEL_ERROR without error', async () => {
      const { result } = renderHook(() =>
        useRealtimeSubscription({ table: 'stories' })
      )

      act(() => {
        subscribeCallback?.('CHANNEL_ERROR')
      })

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('Subscription channel error')
      })
    })
  })

  describe('callbacks', () => {
    it('calls onInsert for INSERT events', async () => {
      const onInsert = vi.fn()
      let payloadHandler: ((payload: any) => void) | null = null

      mockChannel.on.mockImplementation((event, config, handler) => {
        payloadHandler = handler
        return mockChannel
      })

      renderHook(() =>
        useRealtimeSubscription({ table: 'stories', onInsert })
      )

      const newRecord = { id: '1', title: 'New Story' }

      act(() => {
        payloadHandler?.({ eventType: 'INSERT', new: newRecord })
      })

      expect(onInsert).toHaveBeenCalledWith(newRecord)
    })

    it('calls onUpdate for UPDATE events', async () => {
      const onUpdate = vi.fn()
      let payloadHandler: ((payload: any) => void) | null = null

      mockChannel.on.mockImplementation((event, config, handler) => {
        payloadHandler = handler
        return mockChannel
      })

      renderHook(() =>
        useRealtimeSubscription({ table: 'stories', onUpdate })
      )

      const updatedRecord = { id: '1', title: 'Updated Story' }

      act(() => {
        payloadHandler?.({ eventType: 'UPDATE', new: updatedRecord })
      })

      expect(onUpdate).toHaveBeenCalledWith(updatedRecord)
    })

    it('calls onDelete for DELETE events', async () => {
      const onDelete = vi.fn()
      let payloadHandler: ((payload: any) => void) | null = null

      mockChannel.on.mockImplementation((event, config, handler) => {
        payloadHandler = handler
        return mockChannel
      })

      renderHook(() =>
        useRealtimeSubscription({ table: 'stories', onDelete })
      )

      const deletedRecord = { id: '1', title: 'Deleted Story' }

      act(() => {
        payloadHandler?.({ eventType: 'DELETE', old: deletedRecord })
      })

      expect(onDelete).toHaveBeenCalledWith({ old: deletedRecord })
    })
  })

  describe('cleanup', () => {
    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() =>
        useRealtimeSubscription({ table: 'stories' })
      )

      unmount()

      expect(mockChannel.unsubscribe).toHaveBeenCalled()
    })
  })

  describe('resubscription', () => {
    it('resubscribes when table changes', () => {
      const { rerender } = renderHook(
        ({ table }) => useRealtimeSubscription({ table }),
        { initialProps: { table: 'stories' } }
      )

      expect(mockSupabase.channel).toHaveBeenCalledWith('stories-all-changes')

      rerender({ table: 'comments' })

      expect(mockChannel.unsubscribe).toHaveBeenCalled()
      expect(mockSupabase.channel).toHaveBeenCalledWith('comments-all-changes')
    })

    it('resubscribes when filter changes', () => {
      const { rerender } = renderHook(
        ({ filter }) =>
          useRealtimeSubscription({ table: 'stories', filter }),
        { initialProps: { filter: 'id=eq.1' } }
      )

      rerender({ filter: 'id=eq.2' })

      expect(mockChannel.unsubscribe).toHaveBeenCalled()
    })
  })

  describe('callback stability', () => {
    it('does not resubscribe when callbacks change', () => {
      const onInsert1 = vi.fn()
      const onInsert2 = vi.fn()

      const { rerender } = renderHook(
        ({ onInsert }) =>
          useRealtimeSubscription({ table: 'stories', onInsert }),
        { initialProps: { onInsert: onInsert1 } }
      )

      const initialCallCount = mockSupabase.channel.mock.calls.length

      rerender({ onInsert: onInsert2 })

      // Should not create new channel when only callback changes
      expect(mockSupabase.channel.mock.calls.length).toBe(initialCallCount)
    })
  })
})
