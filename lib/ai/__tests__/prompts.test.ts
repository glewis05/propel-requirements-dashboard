import { describe, it, expect } from "vitest"
import {
  ACCEPTANCE_CRITERIA_SYSTEM_PROMPT,
  ACCEPTANCE_CRITERIA_USER_PROMPT,
  RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT,
  RELATIONSHIP_SUGGESTIONS_USER_PROMPT,
} from "../prompts"

describe("lib/ai/prompts", () => {
  describe("ACCEPTANCE_CRITERIA_SYSTEM_PROMPT", () => {
    it("should contain healthcare context", () => {
      expect(ACCEPTANCE_CRITERIA_SYSTEM_PROMPT).toContain("healthcare")
    })

    it("should mention Given/When/Then format", () => {
      expect(ACCEPTANCE_CRITERIA_SYSTEM_PROMPT).toContain("Given/When/Then")
    })

    it("should mention testable criteria", () => {
      expect(ACCEPTANCE_CRITERIA_SYSTEM_PROMPT).toContain("testable")
    })

    it("should mention HIPAA compliance", () => {
      expect(ACCEPTANCE_CRITERIA_SYSTEM_PROMPT).toContain("HIPAA")
    })
  })

  describe("ACCEPTANCE_CRITERIA_USER_PROMPT", () => {
    it("should include title in prompt", () => {
      const prompt = ACCEPTANCE_CRITERIA_USER_PROMPT({
        title: "User Login Feature",
        description: "",
      })
      expect(prompt).toContain("User Login Feature")
    })

    it("should include description when provided", () => {
      const prompt = ACCEPTANCE_CRITERIA_USER_PROMPT({
        title: "Test",
        description: "As a user, I want to login",
      })
      expect(prompt).toContain("As a user, I want to login")
    })

    it("should include user type when provided", () => {
      const prompt = ACCEPTANCE_CRITERIA_USER_PROMPT({
        title: "Test",
        description: "",
        userType: "Clinical User",
      })
      expect(prompt).toContain("Clinical User")
    })

    it("should include program name when provided", () => {
      const prompt = ACCEPTANCE_CRITERIA_USER_PROMPT({
        title: "Test",
        description: "",
        programName: "Providence Connect",
      })
      expect(prompt).toContain("Providence Connect")
    })

    it("should request JSON format response", () => {
      const prompt = ACCEPTANCE_CRITERIA_USER_PROMPT({
        title: "Test",
        description: "",
      })
      expect(prompt).toContain("JSON")
    })

    it("should include example format", () => {
      const prompt = ACCEPTANCE_CRITERIA_USER_PROMPT({
        title: "Test",
        description: "",
      })
      expect(prompt).toContain('"criteria"')
      expect(prompt).toContain('"format"')
    })
  })

  describe("RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT", () => {
    it("should mention parent stories", () => {
      expect(RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT).toContain("Parent stories")
    })

    it("should mention related stories", () => {
      expect(RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT).toContain("Related stories")
    })

    it("should mention confidence score", () => {
      expect(RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT).toContain("confidence")
    })
  })

  describe("RELATIONSHIP_SUGGESTIONS_USER_PROMPT", () => {
    const sampleCurrentStory = {
      story_id: "TEST-001",
      title: "User Authentication",
      description: "Implement user login functionality",
      programName: "Test Program",
    }

    const sampleExistingStories = [
      {
        story_id: "TEST-002",
        title: "Password Reset",
        description: "Allow users to reset passwords",
        program_name: "Test Program",
      },
      {
        story_id: "TEST-003",
        title: "Dashboard View",
        description: "Display user dashboard",
        program_name: "Other Program",
      },
    ]

    it("should include current story details", () => {
      const prompt = RELATIONSHIP_SUGGESTIONS_USER_PROMPT({
        currentStory: sampleCurrentStory,
        existingStories: sampleExistingStories,
      })
      expect(prompt).toContain("TEST-001")
      expect(prompt).toContain("User Authentication")
    })

    it("should include existing stories", () => {
      const prompt = RELATIONSHIP_SUGGESTIONS_USER_PROMPT({
        currentStory: sampleCurrentStory,
        existingStories: sampleExistingStories,
      })
      expect(prompt).toContain("TEST-002")
      expect(prompt).toContain("Password Reset")
      expect(prompt).toContain("TEST-003")
    })

    it("should request JSON format response", () => {
      const prompt = RELATIONSHIP_SUGGESTIONS_USER_PROMPT({
        currentStory: sampleCurrentStory,
        existingStories: sampleExistingStories,
      })
      expect(prompt).toContain("JSON")
    })

    it("should specify confidence threshold", () => {
      const prompt = RELATIONSHIP_SUGGESTIONS_USER_PROMPT({
        currentStory: sampleCurrentStory,
        existingStories: sampleExistingStories,
      })
      expect(prompt).toContain("0.5")
    })

    it("should handle empty existing stories", () => {
      const prompt = RELATIONSHIP_SUGGESTIONS_USER_PROMPT({
        currentStory: sampleCurrentStory,
        existingStories: [],
      })
      expect(prompt).toContain("TEST-001")
    })
  })
})
