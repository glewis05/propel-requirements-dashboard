"use client"

import { FileText, Settings2 } from "lucide-react"
import type { StoryType } from "@/lib/rule-update/constants"

interface StoryTypeSelectorProps {
  value: StoryType
  onChange: (type: StoryType) => void
}

const STORY_TYPE_OPTIONS: {
  value: StoryType
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: "user_story",
    label: "User Story",
    description: "Traditional feature or requirement",
    icon: <FileText className="h-6 w-6" />,
  },
  {
    value: "rule_update",
    label: "Rule Update",
    description: "NCCN/TC rule engine changes with test cases",
    icon: <Settings2 className="h-6 w-6" />,
  },
]

export function StoryTypeSelector({ value, onChange }: StoryTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">What type of story?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the type of story you want to create
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STORY_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all text-left ${
              value === option.value
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <div
              className={`p-3 rounded-full mb-3 ${
                value === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {option.icon}
            </div>
            <h3 className="font-medium text-foreground">{option.label}</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {option.description}
            </p>

            {value === option.value && (
              <div className="absolute top-2 right-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
