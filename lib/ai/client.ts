import Anthropic from "@anthropic-ai/sdk"
import type { AIConfig } from "./types"

// Default AI configuration
export const DEFAULT_AI_CONFIG: AIConfig = {
  model: "claude-sonnet-4-20250514",
  maxTokens: 2048,
  temperature: 0.7,
}

// Singleton client instance
let anthropicClient: Anthropic | null = null

/**
 * Get or create the Anthropic client instance
 * Returns null if API key is not configured
 */
export function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY is not configured")
    return null
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  return anthropicClient
}

/**
 * Check if AI features are available (API key is configured)
 */
export function isAIAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

/**
 * Generic function to call Claude API with error handling
 */
export async function callClaude(params: {
  systemPrompt: string
  userPrompt: string
  config?: Partial<AIConfig>
}): Promise<{ success: boolean; content?: string; error?: string }> {
  const client = getAnthropicClient()

  if (!client) {
    return {
      success: false,
      error: "AI features are not available. Please configure ANTHROPIC_API_KEY.",
    }
  }

  const config = { ...DEFAULT_AI_CONFIG, ...params.config }

  try {
    const message = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: [
        {
          role: "user",
          content: params.userPrompt,
        },
      ],
      system: params.systemPrompt,
    })

    // Extract text content from the response
    const textContent = message.content.find((block) => block.type === "text")
    if (!textContent || textContent.type !== "text") {
      return {
        success: false,
        error: "No text content in AI response",
      }
    }

    return {
      success: true,
      content: textContent.text,
    }
  } catch (error) {
    console.error("Claude API error:", error)

    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return {
          success: false,
          error: "Invalid API key. Please check your ANTHROPIC_API_KEY.",
        }
      }
      if (error.status === 429) {
        return {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        }
      }
      if (error.status === 500 || error.status === 503) {
        return {
          success: false,
          error: "Claude API is temporarily unavailable. Please try again later.",
        }
      }
      return {
        success: false,
        error: `API error: ${error.message}`,
      }
    }

    return {
      success: false,
      error: "An unexpected error occurred while calling the AI service.",
    }
  }
}

/**
 * Parse JSON from Claude response, handling markdown code blocks
 */
export function parseJSONResponse<T>(content: string): T | null {
  try {
    // Remove markdown code blocks if present
    let jsonString = content.trim()
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.slice(7)
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.slice(3)
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.slice(0, -3)
    }

    return JSON.parse(jsonString.trim()) as T
  } catch (error) {
    console.error("Failed to parse JSON response:", error)
    return null
  }
}
