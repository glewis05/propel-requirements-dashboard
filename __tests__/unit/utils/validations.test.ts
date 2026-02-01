import { describe, it, expect } from 'vitest'
import { storyFormSchema, STORY_STATUSES, STORY_PRIORITIES, STORY_CATEGORIES } from '@/lib/validations/story'

describe('storyFormSchema', () => {
  const validStoryWithUserStory = {
    title: 'Test Story Title',
    program_id: 'prog-001',
    status: 'Draft' as const,
    story_type: 'user_story' as const,
    user_story: 'As a user, I want to test, so that I can verify',
  }

  const validStoryWithRole = {
    title: 'Test Story Title',
    program_id: 'prog-001',
    status: 'Draft' as const,
    story_type: 'user_story' as const,
    role: 'Developer',
    capability: 'create new features',
  }

  describe('title validation', () => {
    it('accepts valid title', () => {
      const result = storyFormSchema.safeParse(validStoryWithUserStory)
      expect(result.success).toBe(true)
    })

    it('rejects title shorter than 5 characters', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        title: 'Test',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 5 characters')
      }
    })

    it('rejects title longer than 200 characters', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        title: 'a'.repeat(201),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 200 characters')
      }
    })

    it('accepts title exactly 5 characters', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        title: '12345',
      })
      expect(result.success).toBe(true)
    })

    it('accepts title exactly 200 characters', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        title: 'a'.repeat(200),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('program_id validation', () => {
    it('rejects empty program_id', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        program_id: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Program is required')
      }
    })
  })

  describe('status validation', () => {
    it.each(STORY_STATUSES)('accepts %s status', (status) => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        status,
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        status: 'Invalid Status',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('priority validation', () => {
    it.each(STORY_PRIORITIES)('accepts %s priority', (priority) => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        priority,
      })
      expect(result.success).toBe(true)
    })

    it('accepts null priority', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        priority: null,
      })
      expect(result.success).toBe(true)
    })

    it('accepts undefined priority', () => {
      const result = storyFormSchema.safeParse(validStoryWithUserStory)
      expect(result.success).toBe(true)
    })

    it('rejects invalid priority', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        priority: 'Invalid Priority',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('story_type validation', () => {
    it('accepts user_story type', () => {
      const result = storyFormSchema.safeParse(validStoryWithUserStory)
      expect(result.success).toBe(true)
    })

    it('accepts rule_update type', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        story_type: 'rule_update',
      })
      expect(result.success).toBe(true)
    })

    it('defaults to user_story', () => {
      const { story_type, ...withoutType } = validStoryWithUserStory
      const result = storyFormSchema.safeParse(withoutType)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.story_type).toBe('user_story')
      }
    })
  })

  describe('user story requirement validation', () => {
    it('accepts story with user_story field', () => {
      const result = storyFormSchema.safeParse(validStoryWithUserStory)
      expect(result.success).toBe(true)
    })

    it('accepts story with role and capability', () => {
      const result = storyFormSchema.safeParse(validStoryWithRole)
      expect(result.success).toBe(true)
    })

    it('rejects story without user_story or role+capability', () => {
      const result = storyFormSchema.safeParse({
        title: 'Test Story Title',
        program_id: 'prog-001',
        status: 'Draft',
        story_type: 'user_story',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'user story or role and capability'
        )
      }
    })

    it('rejects story with only role (no capability)', () => {
      const result = storyFormSchema.safeParse({
        title: 'Test Story Title',
        program_id: 'prog-001',
        status: 'Draft',
        story_type: 'user_story',
        role: 'Developer',
      })
      expect(result.success).toBe(false)
    })

    it('rejects story with only capability (no role)', () => {
      const result = storyFormSchema.safeParse({
        title: 'Test Story Title',
        program_id: 'prog-001',
        status: 'Draft',
        story_type: 'user_story',
        capability: 'create features',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('text field length validations', () => {
    it('rejects user_story longer than 2000 characters', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        user_story: 'a'.repeat(2001),
      })
      expect(result.success).toBe(false)
    })

    it('rejects acceptance_criteria longer than 5000 characters', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        acceptance_criteria: 'a'.repeat(5001),
      })
      expect(result.success).toBe(false)
    })

    it('accepts acceptance_criteria at 5000 characters', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        acceptance_criteria: 'a'.repeat(5000),
      })
      expect(result.success).toBe(true)
    })

    it('rejects role longer than 200 characters', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithRole,
        role: 'a'.repeat(201),
      })
      expect(result.success).toBe(false)
    })

    it('rejects capability longer than 500 characters', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithRole,
        capability: 'a'.repeat(501),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('accepts null values for optional fields', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        benefit: null,
        success_metrics: null,
        category: null,
        internal_notes: null,
        meeting_context: null,
        client_feedback: null,
        requirement_id: null,
        parent_story_id: null,
        related_stories: null,
      })
      expect(result.success).toBe(true)
    })

    it('accepts undefined values for optional fields', () => {
      const result = storyFormSchema.safeParse(validStoryWithUserStory)
      expect(result.success).toBe(true)
    })

    it('accepts related_stories as array of strings', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        related_stories: ['story-001', 'story-002'],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('is_technical field', () => {
    it('defaults to false', () => {
      const result = storyFormSchema.safeParse(validStoryWithUserStory)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_technical).toBe(false)
      }
    })

    it('accepts true', () => {
      const result = storyFormSchema.safeParse({
        ...validStoryWithUserStory,
        is_technical: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_technical).toBe(true)
      }
    })
  })
})

describe('STORY_STATUSES', () => {
  it('contains all expected statuses', () => {
    expect(STORY_STATUSES).toContain('Draft')
    expect(STORY_STATUSES).toContain('Internal Review')
    expect(STORY_STATUSES).toContain('Pending Client Review')
    expect(STORY_STATUSES).toContain('Approved')
    expect(STORY_STATUSES).toContain('In Development')
    expect(STORY_STATUSES).toContain('In UAT')
    expect(STORY_STATUSES).toContain('Needs Discussion')
    expect(STORY_STATUSES).toContain('Out of Scope')
  })

  it('has 8 statuses', () => {
    expect(STORY_STATUSES).toHaveLength(8)
  })
})

describe('STORY_PRIORITIES', () => {
  it('contains MoSCoW priorities', () => {
    expect(STORY_PRIORITIES).toContain('Must Have')
    expect(STORY_PRIORITIES).toContain('Should Have')
    expect(STORY_PRIORITIES).toContain('Could Have')
    expect(STORY_PRIORITIES).toContain('Would Have')
  })

  it('has 4 priorities', () => {
    expect(STORY_PRIORITIES).toHaveLength(4)
  })
})

describe('STORY_CATEGORIES', () => {
  it('contains expected categories', () => {
    expect(STORY_CATEGORIES).toContain('User Interface')
    expect(STORY_CATEGORIES).toContain('Data Management')
    expect(STORY_CATEGORIES).toContain('Integration')
    expect(STORY_CATEGORIES).toContain('Reporting')
    expect(STORY_CATEGORIES).toContain('Security')
    expect(STORY_CATEGORIES).toContain('Performance')
    expect(STORY_CATEGORIES).toContain('Compliance')
    expect(STORY_CATEGORIES).toContain('Workflow')
    expect(STORY_CATEGORIES).toContain('Other')
  })

  it('has 9 categories', () => {
    expect(STORY_CATEGORIES).toHaveLength(9)
  })
})
