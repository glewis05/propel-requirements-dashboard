import { z } from "zod"

export const storyFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be less than 200 characters"),
  program_id: z.string().min(1, "Program is required"),
  status: z.enum(["Draft", "Internal Review", "Pending Client Review", "Approved", "In Development", "In UAT", "Needs Discussion", "Out of Scope"]),
  priority: z.enum(["Must Have", "Should Have", "Could Have", "Would Have"]).nullable().optional(),

  // User story components (at least one required)
  user_story: z.string().max(2000, "User story must be less than 2000 characters").nullable().optional(),
  role: z.string().max(200, "Role must be less than 200 characters").nullable().optional(),
  capability: z.string().max(500, "Capability must be less than 500 characters").nullable().optional(),
  benefit: z.string().max(500, "Benefit must be less than 500 characters").nullable().optional(),

  // Requirements detail
  acceptance_criteria: z.string().max(5000, "Acceptance criteria must be less than 5000 characters").nullable().optional(),
  success_metrics: z.string().max(2000, "Success metrics must be less than 2000 characters").nullable().optional(),

  // Classification
  category: z.string().max(100, "Category must be less than 100 characters").nullable().optional(),
  category_full: z.string().max(200, "Full category must be less than 200 characters").nullable().optional(),
  is_technical: z.boolean().default(false),
  roadmap_target: z.string().max(50, "Roadmap target must be less than 50 characters").nullable().optional(),

  // Context & notes
  internal_notes: z.string().max(2000, "Internal notes must be less than 2000 characters").nullable().optional(),
  meeting_context: z.string().max(2000, "Meeting context must be less than 2000 characters").nullable().optional(),
  client_feedback: z.string().max(2000, "Client feedback must be less than 2000 characters").nullable().optional(),

  // Optional metadata
  requirement_id: z.string().nullable().optional(),
  parent_story_id: z.string().nullable().optional(),
  related_stories: z.array(z.string()).nullable().optional(),
}).refine((data) => {
  // Require at least user_story OR role+capability
  return data.user_story || (data.role && data.capability)
}, {
  message: "Please provide either a user story or role and capability",
  path: ["user_story"],
})

export type StoryFormData = z.infer<typeof storyFormSchema>

export const STORY_STATUSES = [
  "Draft",
  "Internal Review",
  "Pending Client Review",
  "Approved",
  "In Development",
  "In UAT",
  "Needs Discussion",
  "Out of Scope",
] as const

export const STORY_PRIORITIES = [
  "Must Have",
  "Should Have",
  "Could Have",
  "Would Have",
] as const

export const STORY_CATEGORIES = [
  "User Interface",
  "Data Management",
  "Integration",
  "Reporting",
  "Security",
  "Performance",
  "Compliance",
  "Workflow",
  "Other",
] as const
