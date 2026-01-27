// TypeScript types for AI feature responses

export interface AcceptanceCriteriaInput {
  title: string
  description: string
  userType?: string
  programName?: string
}

export interface AcceptanceCriteriaSuggestion {
  criteria: string
  format: "gwt" | "bullet" // Given/When/Then or bullet point
}

export interface AcceptanceCriteriaResponse {
  success: boolean
  suggestions?: AcceptanceCriteriaSuggestion[]
  error?: string
}

export interface RelationshipSuggestionInput {
  storyId: string
  title: string
  description: string
  programId: string
}

export interface RelationshipSuggestion {
  story_id: string
  story_title: string
  relationship_type: "parent" | "related"
  confidence: number // 0-1 scale
  reason: string
}

export interface RelationshipSuggestionsResponse {
  success: boolean
  suggestions?: RelationshipSuggestion[]
  error?: string
}

export interface StoryContext {
  story_id: string
  title: string
  description: string
  program_id: string
  program_name?: string
}

// AI model configuration
export interface AIConfig {
  model: string
  maxTokens: number
  temperature: number
}
