"use client"

import { useState, useEffect } from "react"
import {
  Settings2,
  FileText,
  Calendar,
  Tag,
  Hash,
  Clock,
  History,
  RefreshCw,
} from "lucide-react"
import {
  RULE_TYPE_LABELS,
  CHANGE_TYPE_LABELS,
  CHANGE_TYPE_COLORS,
  HISTORY_ACTION_LABELS,
} from "@/lib/rule-update/constants"
import type {
  RuleUpdateDetails,
  RuleTestCase,
  RuleUpdateHistoryEntry,
  RuleType,
  ChangeType,
  HistoryAction,
} from "@/types/rule-update"
import { CollapsibleSection } from "./collapsible-section"
import { RuleTestCaseList } from "./rule-test-case-list"
import {
  getRuleUpdateDetails,
  getRuleTestCases,
  getRuleUpdateHistory,
} from "@/app/(dashboard)/stories/rule-update-actions"

interface RuleUpdateDetailViewProps {
  storyId: string
  initialDetails?: RuleUpdateDetails
  initialTestCases?: RuleTestCase[]
}

export function RuleUpdateDetailView({
  storyId,
  initialDetails,
  initialTestCases,
}: RuleUpdateDetailViewProps) {
  const [details, setDetails] = useState<RuleUpdateDetails | null>(initialDetails || null)
  const [testCases, setTestCases] = useState<RuleTestCase[]>(initialTestCases || [])
  const [history, setHistory] = useState<RuleUpdateHistoryEntry[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const refreshData = async () => {
    const [detailsResult, testCasesResult] = await Promise.all([
      getRuleUpdateDetails(storyId),
      getRuleTestCases(storyId),
    ])

    if (detailsResult.success && detailsResult.data) {
      setDetails(detailsResult.data)
    }
    if (testCasesResult.success && testCasesResult.data) {
      setTestCases(testCasesResult.data)
    }
  }

  const loadHistory = async () => {
    if (historyLoaded) return
    setIsLoadingHistory(true)
    try {
      const result = await getRuleUpdateHistory(storyId)
      if (result.success && result.data) {
        setHistory(result.data)
        setHistoryLoaded(true)
      }
    } finally {
      setIsLoadingHistory(false)
    }
  }

  if (!details) {
    return (
      <div className="rounded-lg bg-card shadow-sm border border-border p-6 text-center">
        <Settings2 className="h-8 w-8 mx-auto text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          Rule update details not found
        </p>
      </div>
    )
  }

  const changeTypeColor = CHANGE_TYPE_COLORS[details.change_type as ChangeType] || ""

  return (
    <div className="space-y-4">
      {/* Rule Details Card */}
      <div className="rounded-lg bg-card shadow-sm border border-border p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Rule Details</h2>
          <span
            className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${changeTypeColor}`}
          >
            {CHANGE_TYPE_LABELS[details.change_type as ChangeType]}
          </span>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Rule Type
            </dt>
            <dd className="mt-1 text-sm text-foreground font-medium">
              {RULE_TYPE_LABELS[details.rule_type as RuleType]}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Target Rule
            </dt>
            <dd className="mt-1 text-sm text-foreground font-mono">
              {details.target_rule}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Change ID
            </dt>
            <dd className="mt-1 text-sm text-foreground font-mono">
              {details.change_id}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Quarter
            </dt>
            <dd className="mt-1 text-sm text-foreground">{details.quarter}</dd>
          </div>

          {details.effective_date && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Effective Date
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {new Date(details.effective_date).toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Rule Description */}
      <CollapsibleSection
        title="Rule Description"
        icon={<FileText className="h-5 w-5 text-primary" />}
        defaultOpen={true}
      >
        {details.rule_description ? (
          <div className="prose prose-sm max-w-none text-foreground">
            <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/30 p-4 rounded-md">
              {details.rule_description}
            </pre>
          </div>
        ) : (
          <p className="text-muted-foreground italic">No rule description defined.</p>
        )}
      </CollapsibleSection>

      {/* Change Summary */}
      {details.change_summary && (
        <CollapsibleSection
          title="Change Summary"
          icon={<RefreshCw className="h-5 w-5 text-warning" />}
          defaultOpen={true}
        >
          <p className="text-foreground whitespace-pre-wrap">
            {details.change_summary}
          </p>
        </CollapsibleSection>
      )}

      {/* Test Cases */}
      <div className="rounded-lg bg-card shadow-sm border border-border p-4 sm:p-6">
        <RuleTestCaseList
          storyId={storyId}
          targetRule={details.target_rule}
          testCases={testCases}
          onUpdate={refreshData}
        />
      </div>

      {/* Audit History */}
      <CollapsibleSection
        title="Change History"
        icon={<History className="h-5 w-5 text-muted-foreground" />}
        defaultOpen={false}
        onToggle={loadHistory}
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((entry) => (
              <HistoryEntryItem key={entry.history_id} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm">No history available.</p>
        )}
      </CollapsibleSection>
    </div>
  )
}

function HistoryEntryItem({ entry }: { entry: RuleUpdateHistoryEntry }) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary/50" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">
            {HISTORY_ACTION_LABELS[entry.action as HistoryAction] || entry.action}
          </span>
          {entry.changed_by_name && (
            <span className="text-muted-foreground">by {entry.changed_by_name}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(entry.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
