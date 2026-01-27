import { Metadata } from "next"
import Link from "next/link"
import {
  HelpCircle,
  CheckCircle,
  MessageSquare,
  Clock,
  ArrowRight,
} from "lucide-react"
import { getOpenQuestions } from "./actions"
import { parseMentionsToText } from "@/components/ui/mention-input"

export const metadata: Metadata = {
  title: "Questions | Providence Requirements Dashboard",
  description: "Open questions across all stories",
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

export default async function QuestionsPage() {
  const result = await getOpenQuestions()
  const questions = result.success ? result.questions || [] : []

  const openQuestions = questions.filter(q => !q.resolved)
  const resolvedQuestions = questions.filter(q => q.resolved)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-warning" />
          Questions
        </h1>
        <p className="text-muted-foreground mt-1">
          Questions from developers and team members across all stories
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-warning">
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Open</span>
          </div>
          <p className="text-2xl font-bold mt-1">{openQuestions.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Resolved</span>
          </div>
          <p className="text-2xl font-bold mt-1">{resolvedQuestions.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">With Answers</span>
          </div>
          <p className="text-2xl font-bold mt-1">
            {questions.filter(q => q.answer_count > 0).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Awaiting Answer</span>
          </div>
          <p className="text-2xl font-bold mt-1">
            {openQuestions.filter(q => q.answer_count === 0).length}
          </p>
        </div>
      </div>

      {/* Open Questions */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-warning" />
            Open Questions ({openQuestions.length})
          </h2>
        </div>

        {openQuestions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No open questions</p>
            <p className="text-sm mt-1">All questions have been resolved!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {openQuestions.map((question) => (
              <Link
                key={question.id}
                href={`/stories/${question.story_id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Question content */}
                    <p className="text-sm line-clamp-2">
                      {parseMentionsToText(question.content)}
                    </p>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {question.user_name}
                      </span>
                      <span>on {question.story_title}</span>
                      <span>{formatRelativeTime(question.created_at)}</span>
                      {question.answer_count > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {question.answer_count} {question.answer_count === 1 ? "answer" : "answers"}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Questions */}
      {resolvedQuestions.length > 0 && (
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Resolved Questions ({resolvedQuestions.length})
            </h2>
          </div>

          <div className="divide-y divide-border">
            {resolvedQuestions.slice(0, 10).map((question) => (
              <Link
                key={question.id}
                href={`/stories/${question.story_id}`}
                className="block p-4 hover:bg-muted/50 transition-colors opacity-75"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Question content */}
                    <p className="text-sm line-clamp-2">
                      {parseMentionsToText(question.content)}
                    </p>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {question.user_name}
                      </span>
                      <span>on {question.story_title}</span>
                      <span>{formatRelativeTime(question.created_at)}</span>
                      {question.accepted_answer_id && (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle className="h-3 w-3" />
                          Has accepted answer
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
            {resolvedQuestions.length > 10 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Showing 10 of {resolvedQuestions.length} resolved questions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
