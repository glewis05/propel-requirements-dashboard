"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type SubscriptionEvent = "INSERT" | "UPDATE" | "DELETE" | "*"

interface UseRealtimeSubscriptionOptions<T> {
  table: string
  schema?: string
  filter?: string
  event?: SubscriptionEvent
  onInsert?: (payload: T) => void
  onUpdate?: (payload: T) => void
  onDelete?: (payload: { old: T }) => void
}

export function useRealtimeSubscription<T extends Record<string, unknown>>(
  options: UseRealtimeSubscriptionOptions<T>
) {
  const {
    table,
    schema = "public",
    filter,
    event = "*",
    onInsert,
    onUpdate,
    onDelete,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Use refs to avoid recreating subscription on callback changes
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete })
  callbacksRef.current = { onInsert, onUpdate, onDelete }

  useEffect(() => {
    const supabase = createClient()

    const channelName = filter
      ? `${table}-${filter.replace(/[^a-zA-Z0-9]/g, "-")}`
      : `${table}-all-changes`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: event,
          schema: schema,
          table: table,
          filter: filter,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          const { onInsert, onUpdate, onDelete } = callbacksRef.current

          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload.new as T)
              break
            case "UPDATE":
              onUpdate?.(payload.new as T)
              break
            case "DELETE":
              onDelete?.({ old: payload.old as T })
              break
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true)
          setError(null)
        } else if (status === "CLOSED") {
          setIsConnected(false)
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false)
          setError(err || new Error("Subscription channel error"))
        }
      })

    // Cleanup on unmount
    return () => {
      channel.unsubscribe()
    }
  }, [table, schema, filter, event])

  return { isConnected, error }
}
