import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MentionInput, parseMentionsToText, extractMentionedUserIds } from '@/components/ui/mention-input'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('MentionInput', () => {
  const mockUsers = [
    { user_id: 'user-001', name: 'John Doe', email: 'john@test.com', role: 'Developer' },
    { user_id: 'user-002', name: 'Jane Smith', email: 'jane@test.com', role: 'Manager' },
    { user_id: 'user-003', name: 'Bob Johnson', email: 'bob@test.com', role: 'Admin' },
  ]

  const mockSupabaseClient = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseClient)
  })

  describe('basic rendering', () => {
    it('renders a textarea', () => {
      const { container } = render(<MentionInput value="" onChange={vi.fn()} />)
      expect(container.querySelector('textarea')).toBeInTheDocument()
    })

    it('renders with default placeholder', () => {
      const { container } = render(<MentionInput value="" onChange={vi.fn()} />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('placeholder', 'Type @ to mention someone...')
    })

    it('renders with custom placeholder', () => {
      const { container } = render(<MentionInput value="" onChange={vi.fn()} placeholder="Add a comment..." />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('placeholder', 'Add a comment...')
    })

    it('renders with specified rows', () => {
      const { container } = render(<MentionInput value="" onChange={vi.fn()} rows={5} />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('rows', '5')
    })

    it('renders with value', () => {
      const { container } = render(<MentionInput value="Hello world" onChange={vi.fn()} />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveValue('Hello world')
    })
  })

  describe('disabled state', () => {
    it('disables textarea when disabled prop is true', () => {
      const { container } = render(<MentionInput value="" onChange={vi.fn()} disabled />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toBeDisabled()
    })
  })

  describe('onChange handler', () => {
    it('calls onChange when typing', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      const { container } = render(<MentionInput value="" onChange={handleChange} />)
      const textarea = container.querySelector('textarea')!

      await user.type(textarea, 'Hello')
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('mention suggestions', () => {
    it('shows suggestions dropdown when @ is typed', async () => {
      const user = userEvent.setup()
      const { container } = render(<MentionInput value="" onChange={vi.fn()} />)
      const textarea = container.querySelector('textarea')!

      await user.type(textarea, '@J')

      await waitFor(() => {
        // Check for suggestions container
        expect(container.querySelector('[class*="absolute"]')).toBeInTheDocument()
      })
    })

    it('hides suggestions when typing space after @', async () => {
      const user = userEvent.setup()
      let value = ''
      const handleChange = (newValue: string) => {
        value = newValue
      }
      const { container, rerender } = render(<MentionInput value={value} onChange={handleChange} />)
      const textarea = container.querySelector('textarea')!

      await user.type(textarea, '@ ')
      rerender(<MentionInput value="@ " onChange={handleChange} />)

      // Suggestions should be hidden
      await waitFor(() => {
        const dropdown = container.querySelector('.max-h-48')
        // Either no dropdown or dropdown is not visible
        expect(dropdown).toBeFalsy()
      })
    })
  })

  describe('keyboard navigation', () => {
    it('closes suggestions on Escape', async () => {
      const user = userEvent.setup()
      const { container } = render(<MentionInput value="" onChange={vi.fn()} />)
      const textarea = container.querySelector('textarea')!

      await user.type(textarea, '@J')
      await user.keyboard('{Escape}')

      // Dropdown should close
      await waitFor(() => {
        const suggestionButtons = container.querySelectorAll('button')
        expect(suggestionButtons.length).toBe(0)
      })
    })
  })

  describe('maxLength', () => {
    it('applies maxLength attribute', () => {
      const { container } = render(<MentionInput value="" onChange={vi.fn()} maxLength={100} />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('maxLength', '100')
    })

    it('uses default maxLength of 5000', () => {
      const { container } = render(<MentionInput value="" onChange={vi.fn()} />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveAttribute('maxLength', '5000')
    })
  })

  describe('custom className', () => {
    it('applies custom className to textarea', () => {
      const { container } = render(<MentionInput value="" onChange={vi.fn()} className="custom-class" />)
      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveClass('custom-class')
    })
  })

  describe('onMentionUsers callback', () => {
    it('calls onMentionUsers with extracted user IDs', async () => {
      const handleMentionUsers = vi.fn()
      render(
        <MentionInput
          value="Hello @[John Doe](user-001) and @[Jane Smith](user-002)"
          onChange={vi.fn()}
          onMentionUsers={handleMentionUsers}
        />
      )

      await waitFor(() => {
        expect(handleMentionUsers).toHaveBeenCalledWith(['user-001', 'user-002'])
      })
    })
  })
})

describe('parseMentionsToText', () => {
  it('converts mention format to plain text with @', () => {
    const input = 'Hello @[John Doe](user-001)'
    const output = parseMentionsToText(input)
    expect(output).toBe('Hello @John Doe')
  })

  it('handles multiple mentions', () => {
    const input = '@[John Doe](user-001) and @[Jane Smith](user-002)'
    const output = parseMentionsToText(input)
    expect(output).toBe('@John Doe and @Jane Smith')
  })

  it('returns original text when no mentions', () => {
    const input = 'Hello world'
    const output = parseMentionsToText(input)
    expect(output).toBe('Hello world')
  })

  it('handles empty string', () => {
    const output = parseMentionsToText('')
    expect(output).toBe('')
  })

  it('preserves other text formatting', () => {
    const input = 'Check this: @[John Doe](user-001)!\n\nThanks'
    const output = parseMentionsToText(input)
    expect(output).toBe('Check this: @John Doe!\n\nThanks')
  })
})

describe('extractMentionedUserIds', () => {
  it('extracts user ID from single mention', () => {
    const input = 'Hello @[John Doe](user-001)'
    const userIds = extractMentionedUserIds(input)
    expect(userIds).toEqual(['user-001'])
  })

  it('extracts multiple user IDs', () => {
    const input = '@[John Doe](user-001) and @[Jane Smith](user-002)'
    const userIds = extractMentionedUserIds(input)
    expect(userIds).toEqual(['user-001', 'user-002'])
  })

  it('returns empty array when no mentions', () => {
    const input = 'Hello world'
    const userIds = extractMentionedUserIds(input)
    expect(userIds).toEqual([])
  })

  it('returns empty array for empty string', () => {
    const userIds = extractMentionedUserIds('')
    expect(userIds).toEqual([])
  })

  it('handles duplicate mentions', () => {
    const input = '@[John Doe](user-001) said @[John Doe](user-001)'
    const userIds = extractMentionedUserIds(input)
    // Returns both occurrences
    expect(userIds).toEqual(['user-001', 'user-001'])
  })

  it('handles UUIDs as user IDs', () => {
    const input = '@[John](550e8400-e29b-41d4-a716-446655440000)'
    const userIds = extractMentionedUserIds(input)
    expect(userIds).toEqual(['550e8400-e29b-41d4-a716-446655440000'])
  })
})
