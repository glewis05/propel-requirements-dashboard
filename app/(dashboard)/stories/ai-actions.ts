"use server"

import { createClient } from "@/lib/supabase/server"
import { callClaude, parseJSONResponse, isAIAvailable } from "@/lib/ai/client"
import {
  ACCEPTANCE_CRITERIA_SYSTEM_PROMPT,
  ACCEPTANCE_CRITERIA_USER_PROMPT,
  RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT,
  RELATIONSHIP_SUGGESTIONS_USER_PROMPT,
} from "@/lib/ai/prompts"
import type {
  AcceptanceCriteriaResponse,
  AcceptanceCriteriaSuggestion,
  RelationshipSuggestionsResponse,
  RelationshipSuggestion,
} from "@/lib/ai/types"
import type { Database } from "@/types/database"

type UserStory = Database["public"]["Tables"]["user_stories"]["Row"]
type Program = Database["public"]["Tables"]["programs"]["Row"]

/**
 * Check if AI features are available
 */
export async function checkAIAvailability(): Promise<boolean> {
  return isAIAvailable()
}

/**
 * Generate acceptance criteria suggestions using AI
 */
export async function generateAcceptanceCriteria(storyData: {
  title: string
  description: string
  userType?: string
  programName?: string
}): Promise<AcceptanceCriteriaResponse> {
  // Validate input
  if (!storyData.title || storyData.title.trim().length < 5) {
    return {
      success: false,
      error: "Please provide a story title with at least 5 characters.",
    }
  }

  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to use AI features.",
    }
  }

  // Build the user prompt
  const userPrompt = ACCEPTANCE_CRITERIA_USER_PROMPT({
    title: storyData.title,
    description: storyData.description || "",
    userType: storyData.userType,
    programName: storyData.programName,
  })

  // Call Claude API
  const response = await callClaude({
    systemPrompt: ACCEPTANCE_CRITERIA_SYSTEM_PROMPT,
    userPrompt,
    config: {
      temperature: 0.7,
      maxTokens: 2048,
    },
  })

  if (!response.success || !response.content) {
    return {
      success: false,
      error: response.error || "Failed to generate acceptance criteria.",
    }
  }

  // Parse the JSON response
  const suggestions = parseJSONResponse<AcceptanceCriteriaSuggestion[]>(response.content)

  if (!suggestions || !Array.isArray(suggestions)) {
    return {
      success: false,
      error: "Failed to parse AI response. Please try again.",
    }
  }

  return {
    success: true,
    suggestions,
  }
}

/**
 * Get relationship suggestions using AI
 * @param storyId - Optional story ID (not required for create mode)
 * @param storyData - Story data including title, description, and optionally programId for create mode
 */
export async function getRelationshipSuggestions(
  storyId: string | null,
  storyData: { title: string; description: string; programId?: string; existingRelated?: string[] }
): Promise<RelationshipSuggestionsResponse> {
  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to use AI features.",
    }
  }

  // Validate input
  if (!storyData.title || storyData.title.trim().length < 5) {
    return {
      success: false,
      error: "Story must have a title to generate relationship suggestions.",
    }
  }

  let programId: string | null = storyData.programId || null
  let description = storyData.description
  let existingRelated: string[] = storyData.existingRelated || []
  let programName: string | undefined

  // For edit mode, fetch current story details
  if (storyId) {
    const { data: currentStoryData, error: storyError } = await supabase
      .from("user_stories")
      .select("story_id, title, user_story, role, capability, benefit, program_id, related_stories")
      .eq("story_id", storyId)
      .single()

    if (storyError || !currentStoryData) {
      return {
        success: false,
        error: "Could not find the story.",
      }
    }

    const currentStory = currentStoryData as Pick<UserStory, "story_id" | "title" | "user_story" | "role" | "capability" | "benefit" | "program_id" | "related_stories">
    programId = currentStory.program_id
    existingRelated = (currentStory.related_stories as string[]) || []

    // Build story description from available fields if not provided
    if (!description) {
      description = currentStory.user_story ||
        (currentStory.role && currentStory.capability
          ? `As a ${currentStory.role}, I want to ${currentStory.capability}${currentStory.benefit ? ` so that ${currentStory.benefit}` : ""}`
          : "")
    }
  }

  // Fetch program name if we have a programId
  if (programId) {
    const { data: programData } = await supabase
      .from("programs")
      .select("name")
      .eq("program_id", programId)
      .single()

    programName = (programData as Pick<Program, "name"> | null)?.name
  }

  // Fetch other stories to compare against (excluding current story and already related)
  const excludeIds = storyId ? [storyId, ...existingRelated] : existingRelated

  const { data: otherStoriesData, error: fetchError } = await supabase
    .from("user_stories")
    .select("story_id, title, user_story, role, capability, benefit, program_id")
    .not("story_id", "in", `(${excludeIds.join(",")})`)
    .limit(50) // Limit to avoid too much context

  if (fetchError) {
    return {
      success: false,
      error: "Failed to fetch existing stories for comparison.",
    }
  }

  const otherStories = (otherStoriesData || []) as Array<Pick<UserStory, "story_id" | "title" | "user_story" | "role" | "capability" | "benefit" | "program_id">>

  if (otherStories.length === 0) {
    return {
      success: true,
      suggestions: [],
    }
  }

  // Fetch program names for other stories
  const programIds = Array.from(new Set(otherStories.map((s) => s.program_id)))
  const { data: programsData } = await supabase
    .from("programs")
    .select("program_id, name")
    .in("program_id", programIds)

  const programs = (programsData || []) as Array<Pick<Program, "program_id" | "name">>
  const programMap = new Map(programs.map((p) => [p.program_id, p.name]))

  // Build story contexts for AI
  const existingStoriesContext = otherStories.map((s) => ({
    story_id: s.story_id,
    title: s.title,
    description:
      s.user_story ||
      (s.role && s.capability
        ? `As a ${s.role}, I want to ${s.capability}${s.benefit ? ` so that ${s.benefit}` : ""}`
        : ""),
    program_name: programMap.get(s.program_id),
  }))

  // Build the user prompt
  const userPrompt = RELATIONSHIP_SUGGESTIONS_USER_PROMPT({
    currentStory: {
      story_id: storyId || "new-story",
      title: storyData.title,
      description,
      programName,
    },
    existingStories: existingStoriesContext,
  })

  // Call Claude API
  const response = await callClaude({
    systemPrompt: RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT,
    userPrompt,
    config: {
      temperature: 0.5, // Lower temperature for more consistent analysis
      maxTokens: 2048,
    },
  })

  if (!response.success || !response.content) {
    return {
      success: false,
      error: response.error || "Failed to generate relationship suggestions.",
    }
  }

  // Parse the JSON response
  const suggestions = parseJSONResponse<RelationshipSuggestion[]>(response.content)

  if (!suggestions || !Array.isArray(suggestions)) {
    return {
      success: false,
      error: "Failed to parse AI response. Please try again.",
    }
  }

  // Validate and filter suggestions
  const validSuggestions = suggestions
    .filter((s) => {
      // Ensure the suggested story exists in our list
      const exists = otherStories.some((os) => os.story_id === s.story_id)
      return exists && s.confidence >= 0.5
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10)

  return {
    success: true,
    suggestions: validSuggestions,
  }
}
