"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { User, Loader2 } from "lucide-react"

interface MentionUser {
  user_id: string
  name: string
  email: string | null
  role: string | null
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onMentionUsers?: (userIds: string[]) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  maxLength?: number
  className?: string
}

export function MentionInput({
  value,
  onChange,
  onMentionUsers,
  placeholder = "Type @ to mention someone...",
  rows = 3,
  disabled = false,
  maxLength = 5000,
  className = "",
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<MentionUser[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Track mentioned users
  const extractMentionedUserIds = useCallback((text: string): string[] => {
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g
    const userIds: string[] = []
    let match
    while ((match = mentionPattern.exec(text)) !== null) {
      userIds.push(match[2])
    }
    return userIds
  }, [])

  useEffect(() => {
    if (onMentionUsers) {
      const userIds = extractMentionedUserIds(value)
      onMentionUsers(userIds)
    }
  }, [value, onMentionUsers, extractMentionedUserIds])

  // Search for users
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("users")
      .select("user_id, name, email, role")
      .eq("status", "Active")
      .ilike("name", `%${query}%`)
      .limit(5)

    if (!error && data) {
      setSuggestions(data)
    }
    setIsLoading(false)
  }, [])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart

    onChange(newValue)

    // Check if we're in a mention context
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      // Only show suggestions if there's no space after @ (still typing the name)
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionStartIndex(lastAtIndex)
        setMentionQuery(textAfterAt)
        setShowSuggestions(true)
        setSelectedIndex(0)
        searchUsers(textAfterAt)
        return
      }
    }

    setShowSuggestions(false)
    setMentionQuery("")
    setMentionStartIndex(-1)
  }

  // Handle selecting a user from suggestions
  const selectUser = useCallback(
    (user: MentionUser) => {
      if (mentionStartIndex === -1) return

      const textarea = textareaRef.current
      if (!textarea) return

      const beforeMention = value.slice(0, mentionStartIndex)
      const afterMention = value.slice(mentionStartIndex + mentionQuery.length + 1)

      // Insert mention in the format @[Name](user_id)
      const mention = `@[${user.name}](${user.user_id})`
      const newValue = `${beforeMention}${mention}${afterMention}`

      onChange(newValue)
      setShowSuggestions(false)
      setMentionQuery("")
      setMentionStartIndex(-1)

      // Focus back on textarea and position cursor after mention
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = beforeMention.length + mention.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    },
    [value, mentionStartIndex, mentionQuery, onChange]
  )

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case "Enter":
        if (showSuggestions) {
          e.preventDefault()
          selectUser(suggestions[selectedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setShowSuggestions(false)
        break
      case "Tab":
        if (showSuggestions) {
          e.preventDefault()
          selectUser(suggestions[selectedIndex])
        }
        break
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm ${className}`}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md bg-card border border-border shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((user, index) => (
              <button
                key={user.user_id}
                type="button"
                onClick={() => selectUser(user)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-primary/10 text-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.role || "User"}
                  </p>
                </div>
              </button>
            ))
          ) : mentionQuery.length > 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Type to search users...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to parse mentions from text and return plain text
export function parseMentionsToText(text: string): string {
  return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1")
}

// Helper function to extract mentioned user IDs
export function extractMentionedUserIds(text: string): string[] {
  const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g
  const userIds: string[] = []
  let match
  while ((match = mentionPattern.exec(text)) !== null) {
    userIds.push(match[2])
  }
  return userIds
}
