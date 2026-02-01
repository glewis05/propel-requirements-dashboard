import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  describe('basic class merging', () => {
    it('merges single class', () => {
      expect(cn('foo')).toBe('foo')
    })

    it('merges multiple classes', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles empty input', () => {
      expect(cn()).toBe('')
    })

    it('handles undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    })

    it('handles null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar')
    })

    it('handles false values', () => {
      expect(cn('foo', false, 'bar')).toBe('foo bar')
    })
  })

  describe('conditional classes', () => {
    it('handles conditional classes with boolean', () => {
      const isActive = true
      expect(cn('base', isActive && 'active')).toBe('base active')
    })

    it('excludes false conditional classes', () => {
      const isActive = false
      expect(cn('base', isActive && 'active')).toBe('base')
    })

    it('handles ternary expressions', () => {
      const variant = 'primary'
      expect(cn('btn', variant === 'primary' ? 'btn-primary' : 'btn-secondary')).toBe('btn btn-primary')
    })
  })

  describe('tailwind merge', () => {
    it('handles conflicting width classes', () => {
      expect(cn('w-4', 'w-6')).toBe('w-6')
    })

    it('handles conflicting padding classes', () => {
      expect(cn('p-4', 'p-6')).toBe('p-6')
    })

    it('handles conflicting background colors', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })

    it('handles conflicting text colors', () => {
      expect(cn('text-white', 'text-black')).toBe('text-black')
    })

    it('keeps non-conflicting classes', () => {
      expect(cn('w-4 h-4', 'p-2')).toBe('w-4 h-4 p-2')
    })

    it('handles responsive prefixes', () => {
      expect(cn('p-2', 'md:p-4')).toBe('p-2 md:p-4')
    })

    it('handles state prefixes', () => {
      expect(cn('bg-blue-500', 'hover:bg-blue-600')).toBe('bg-blue-500 hover:bg-blue-600')
    })

    it('merges conflicting flex directions', () => {
      expect(cn('flex-row', 'flex-col')).toBe('flex-col')
    })

    it('handles arbitrary values', () => {
      expect(cn('w-[100px]', 'h-[50px]')).toBe('w-[100px] h-[50px]')
    })
  })

  describe('array input', () => {
    it('handles array of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('handles mixed array and string input', () => {
      expect(cn(['foo'], 'bar')).toBe('foo bar')
    })
  })

  describe('object input (clsx style)', () => {
    it('handles object with boolean values', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('handles mixed string and object', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active')
    })
  })

  describe('edge cases', () => {
    it('handles duplicate classes', () => {
      // Note: cn doesn't deduplicate non-conflicting classes - this is expected behavior
      // It only deduplicates conflicting tailwind classes like w-4 w-6
      expect(cn('foo foo foo')).toBe('foo foo foo')
    })

    it('handles extra whitespace', () => {
      expect(cn('  foo   bar  ')).toBe('foo bar')
    })

    it('handles empty strings', () => {
      expect(cn('', 'foo', '')).toBe('foo')
    })
  })

  describe('real-world usage', () => {
    it('merges button styles', () => {
      const isDisabled = false
      const isPrimary = true
      const result = cn(
        'px-4 py-2 rounded',
        isPrimary && 'bg-blue-500 text-white',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )
      expect(result).toBe('px-4 py-2 rounded bg-blue-500 text-white')
    })

    it('handles component with className prop', () => {
      const baseClasses = 'p-4 bg-white'
      const userClassName = 'mt-2 bg-gray-100'
      expect(cn(baseClasses, userClassName)).toBe('p-4 mt-2 bg-gray-100')
    })

    it('handles variant and size patterns', () => {
      const variant = 'destructive'
      const size = 'lg'
      const result = cn(
        'btn',
        variant === 'destructive' ? 'bg-red-500' : 'bg-blue-500',
        size === 'lg' ? 'text-lg px-6 py-3' : 'text-sm px-4 py-2'
      )
      expect(result).toBe('btn bg-red-500 text-lg px-6 py-3')
    })
  })
})
