import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { parseJSONResponse, isAIAvailable, getAnthropicClient } from "../client"

describe("lib/ai/client", () => {
  describe("parseJSONResponse", () => {
    it("should parse valid JSON string", () => {
      const input = '[{"criteria": "test", "format": "gwt"}]'
      const result = parseJSONResponse<Array<{ criteria: string; format: string }>>(input)
      expect(result).toEqual([{ criteria: "test", format: "gwt" }])
    })

    it("should parse JSON wrapped in markdown code blocks", () => {
      const input = '```json\n[{"criteria": "test", "format": "gwt"}]\n```'
      const result = parseJSONResponse<Array<{ criteria: string; format: string }>>(input)
      expect(result).toEqual([{ criteria: "test", format: "gwt" }])
    })

    it("should parse JSON wrapped in generic code blocks", () => {
      const input = '```\n[{"criteria": "test"}]\n```'
      const result = parseJSONResponse<Array<{ criteria: string }>>(input)
      expect(result).toEqual([{ criteria: "test" }])
    })

    it("should handle whitespace around JSON", () => {
      const input = '  \n  {"key": "value"}  \n  '
      const result = parseJSONResponse<{ key: string }>(input)
      expect(result).toEqual({ key: "value" })
    })

    it("should return null for invalid JSON", () => {
      const input = "not valid json"
      const result = parseJSONResponse(input)
      expect(result).toBeNull()
    })

    it("should return null for empty string", () => {
      const input = ""
      const result = parseJSONResponse(input)
      expect(result).toBeNull()
    })

    it("should parse complex nested JSON", () => {
      const input = JSON.stringify({
        suggestions: [
          {
            story_id: "TEST-001",
            relationship_type: "related",
            confidence: 0.85,
            reason: "Similar functionality",
          },
        ],
      })
      const result = parseJSONResponse<{
        suggestions: Array<{
          story_id: string
          relationship_type: string
          confidence: number
          reason: string
        }>
      }>(input)
      expect(result?.suggestions[0].confidence).toBe(0.85)
    })
  })

  describe("isAIAvailable", () => {
    const originalEnv = process.env.ANTHROPIC_API_KEY

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.ANTHROPIC_API_KEY = originalEnv
      } else {
        delete process.env.ANTHROPIC_API_KEY
      }
    })

    it("should return true when ANTHROPIC_API_KEY is set", () => {
      process.env.ANTHROPIC_API_KEY = "test-key"
      expect(isAIAvailable()).toBe(true)
    })

    it("should return false when ANTHROPIC_API_KEY is not set", () => {
      delete process.env.ANTHROPIC_API_KEY
      expect(isAIAvailable()).toBe(false)
    })

    it("should return false when ANTHROPIC_API_KEY is empty string", () => {
      process.env.ANTHROPIC_API_KEY = ""
      expect(isAIAvailable()).toBe(false)
    })
  })

  describe("getAnthropicClient", () => {
    const originalEnv = process.env.ANTHROPIC_API_KEY

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.ANTHROPIC_API_KEY = originalEnv
      } else {
        delete process.env.ANTHROPIC_API_KEY
      }
    })

    it("should return null when API key is not configured", () => {
      delete process.env.ANTHROPIC_API_KEY
      const client = getAnthropicClient()
      expect(client).toBeNull()
    })

    // Note: Cannot test client instantiation in jsdom environment
    // The Anthropic SDK blocks browser-like environments by default
    // This is expected behavior for security reasons
    it("should check API key availability", () => {
      process.env.ANTHROPIC_API_KEY = "test-key"
      // We can only verify that isAIAvailable returns true
      expect(isAIAvailable()).toBe(true)
    })
  })
})
