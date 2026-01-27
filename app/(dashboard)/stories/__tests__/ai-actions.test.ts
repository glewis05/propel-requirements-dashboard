import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock the modules before importing the actions
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/ai/client", () => ({
  isAIAvailable: vi.fn(),
  callClaude: vi.fn(),
  parseJSONResponse: vi.fn(),
}))

import { generateAcceptanceCriteria, getRelationshipSuggestions, checkAIAvailability } from "../ai-actions"
import { createClient } from "@/lib/supabase/server"
import { isAIAvailable, callClaude, parseJSONResponse } from "@/lib/ai/client"

describe("ai-actions", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        not: vi.fn(() => ({
          limit: vi.fn(),
        })),
        in: vi.fn(),
      })),
    })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as ReturnType<typeof createClient>)
    vi.mocked(isAIAvailable).mockReturnValue(true)
  })

  describe("checkAIAvailability", () => {
    it("should return true when AI is available", async () => {
      vi.mocked(isAIAvailable).mockReturnValue(true)
      const result = await checkAIAvailability()
      expect(result).toBe(true)
    })

    it("should return false when AI is not available", async () => {
      vi.mocked(isAIAvailable).mockReturnValue(false)
      const result = await checkAIAvailability()
      expect(result).toBe(false)
    })
  })

  describe("generateAcceptanceCriteria", () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      })
    })

    it("should return error for title less than 5 characters", async () => {
      const result = await generateAcceptanceCriteria({
        title: "Test",
        description: "A description",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("5 characters")
    })

    it("should return error for empty title", async () => {
      const result = await generateAcceptanceCriteria({
        title: "",
        description: "A description",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("5 characters")
    })

    it("should return error when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await generateAcceptanceCriteria({
        title: "Valid Title",
        description: "A description",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("logged in")
    })

    it("should return suggestions on successful API call", async () => {
      const mockSuggestions = [
        { criteria: "Given a user\nWhen they login\nThen they see dashboard", format: "gwt" },
        { criteria: "Given a user\nWhen they logout\nThen they see login page", format: "gwt" },
      ]

      vi.mocked(callClaude).mockResolvedValue({
        success: true,
        content: JSON.stringify(mockSuggestions),
      })
      vi.mocked(parseJSONResponse).mockReturnValue(mockSuggestions)

      const result = await generateAcceptanceCriteria({
        title: "User Authentication",
        description: "Allow users to login and logout",
        userType: "Clinical User",
        programName: "Providence Connect",
      })

      expect(result.success).toBe(true)
      expect(result.suggestions).toHaveLength(2)
      expect(result.suggestions?.[0].criteria).toContain("login")
    })

    it("should return error when API call fails", async () => {
      vi.mocked(callClaude).mockResolvedValue({
        success: false,
        error: "Rate limit exceeded",
      })

      const result = await generateAcceptanceCriteria({
        title: "Valid Title Here",
        description: "A description",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Rate limit")
    })

    it("should return error when response parsing fails", async () => {
      vi.mocked(callClaude).mockResolvedValue({
        success: true,
        content: "not valid json",
      })
      vi.mocked(parseJSONResponse).mockReturnValue(null)

      const result = await generateAcceptanceCriteria({
        title: "Valid Title Here",
        description: "A description",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("parse")
    })
  })

  describe("getRelationshipSuggestions", () => {
    const mockCurrentStory = {
      story_id: "TEST-001",
      title: "User Authentication",
      user_story: "As a user, I want to login",
      role: null,
      capability: null,
      benefit: null,
      program_id: "prog-1",
      related_stories: [],
    }

    const mockOtherStories = [
      {
        story_id: "TEST-002",
        title: "Password Reset",
        user_story: "As a user, I want to reset password",
        role: null,
        capability: null,
        benefit: null,
        program_id: "prog-1",
      },
      {
        story_id: "TEST-003",
        title: "Dashboard View",
        user_story: "As a user, I want to see dashboard",
        role: null,
        capability: null,
        benefit: null,
        program_id: "prog-1",
      },
    ]

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      })

      // Setup mock chain for story fetching
      const mockSingleChain = {
        single: vi.fn().mockResolvedValue({ data: mockCurrentStory, error: null }),
      }
      const mockEqChain = {
        eq: vi.fn().mockReturnValue(mockSingleChain),
        single: vi.fn().mockResolvedValue({ data: { name: "Test Program" }, error: null }),
      }
      const mockNotChain = {
        limit: vi.fn().mockResolvedValue({ data: mockOtherStories, error: null }),
      }
      const mockInChain = vi.fn().mockResolvedValue({ data: [{ program_id: "prog-1", name: "Test Program" }], error: null })

      const mockSelectChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(mockSingleChain),
          not: vi.fn().mockReturnValue(mockNotChain),
          in: mockInChain,
        }),
      }

      mockSupabase.from.mockReturnValue(mockSelectChain)
    })

    it("should return error when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await getRelationshipSuggestions("TEST-001", {
        title: "Test Story",
        description: "A description",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("logged in")
    })

    it("should return error for title less than 5 characters", async () => {
      const result = await getRelationshipSuggestions("TEST-001", {
        title: "Test",
        description: "A description",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("title")
    })
  })
})
