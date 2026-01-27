// System prompts and prompt templates for AI features

export const ACCEPTANCE_CRITERIA_SYSTEM_PROMPT = `You are an expert business analyst helping to write acceptance criteria for user stories in a healthcare software context (Providence Health & Services).

Your role is to generate clear, testable acceptance criteria that follow best practices:
- Use Given/When/Then (GWT) format for behavior-driven criteria
- Each criterion should be specific, measurable, and verifiable
- Consider edge cases, error handling, and security requirements
- Include accessibility considerations where relevant
- Focus on user outcomes rather than implementation details
- Consider HIPAA compliance and healthcare data sensitivity

Generate 5-8 acceptance criteria that comprehensively cover the user story requirements.`

export const ACCEPTANCE_CRITERIA_USER_PROMPT = (params: {
  title: string
  description: string
  userType?: string
  programName?: string
}) => {
  const { title, description, userType, programName } = params

  let prompt = `Generate acceptance criteria for the following user story:

**Title:** ${title}

**Description/User Story:** ${description || "Not provided"}`

  if (userType) {
    prompt += `\n\n**User Type:** ${userType}`
  }

  if (programName) {
    prompt += `\n\n**Program Context:** ${programName}`
  }

  prompt += `

Please provide 5-8 testable acceptance criteria. Format each criterion using Given/When/Then format:

Given [precondition/context]
When [action/trigger]
Then [expected outcome]

Respond with ONLY a JSON array of objects, each with:
- "criteria": the full acceptance criteria text
- "format": always "gwt" for Given/When/Then format

Example response format:
[
  {
    "criteria": "Given a logged-in clinical user\\nWhen they navigate to the patient dashboard\\nThen they see the patient's current vitals",
    "format": "gwt"
  }
]`

  return prompt
}

export const RELATIONSHIP_SUGGESTIONS_SYSTEM_PROMPT = `You are an expert at analyzing software requirements and identifying relationships between user stories.

Your role is to identify:
1. **Parent stories** - Stories that could serve as epics or parent features that this story belongs under
2. **Related stories** - Stories that share common themes, dependencies, or affected areas

When suggesting relationships, consider:
- Functional overlap or dependencies
- Shared user types or personas
- Common technical components
- Feature groupings and epics
- Stories that should be implemented together
- Stories that have prerequisite relationships

Provide a confidence score (0-1) for each suggestion based on how strongly related the stories are.`

export const RELATIONSHIP_SUGGESTIONS_USER_PROMPT = (params: {
  currentStory: {
    story_id: string
    title: string
    description: string
    programName?: string
  }
  existingStories: Array<{
    story_id: string
    title: string
    description: string
    program_name?: string
  }>
}) => {
  const { currentStory, existingStories } = params

  let prompt = `Analyze the following user story and suggest related stories from the existing backlog.

**Current Story:**
- ID: ${currentStory.story_id}
- Title: ${currentStory.title}
- Description: ${currentStory.description || "Not provided"}`

  if (currentStory.programName) {
    prompt += `\n- Program: ${currentStory.programName}`
  }

  prompt += `

**Existing Stories to Consider:**
${existingStories.map(s => `
- ID: ${s.story_id}
  Title: ${s.title}
  Description: ${s.description || "No description"}
  Program: ${s.program_name || "Unknown"}`).join("\n")}

Analyze these stories and identify:
1. Potential parent stories (broader features this story could belong to)
2. Related stories (stories with functional overlap or dependencies)

Respond with ONLY a JSON array of suggested relationships:
[
  {
    "story_id": "ID of the related story",
    "story_title": "Title of the related story",
    "relationship_type": "parent" or "related",
    "confidence": 0.85,
    "reason": "Brief explanation of why these stories are related"
  }
]

Only include stories with confidence >= 0.5. Rank by confidence (highest first). Maximum 10 suggestions.
If no strong relationships are found, return an empty array: []`

  return prompt
}
