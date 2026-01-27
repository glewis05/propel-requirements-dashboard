"use client"

import { useState, useMemo } from "react"
import { diffWords, diffLines } from "diff"
import {
  Clock,
  ChevronDown,
  ChevronRight,
  GitCompare,
  Eye,
  X,
  Tag,
} from "lucide-react"
import type { Database } from "@/types/database"

type StoryVersion = Database["public"]["Tables"]["story_versions"]["Row"]

interface VersionHistoryProps {
  versions: StoryVersion[]
  currentVersion: number
}

interface DiffViewProps {
  oldText: string
  newText: string
  type: "words" | "lines"
}

function DiffView({ oldText, newText, type }: DiffViewProps) {
  const diff = useMemo(() => {
    if (type === "lines") {
      return diffLines(oldText || "", newText || "")
    }
    return diffWords(oldText || "", newText || "")
  }, [oldText, newText, type])

  return (
    <div className="font-mono text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md overflow-x-auto">
      {diff.map((part, index) => {
        if (part.added) {
          return (
            <span key={index} className="bg-success/20 text-success-foreground">
              {part.value}
            </span>
          )
        }
        if (part.removed) {
          return (
            <span key={index} className="bg-destructive/20 text-destructive line-through">
              {part.value}
            </span>
          )
        }
        return <span key={index}>{part.value}</span>
      })}
    </div>
  )
}

export function VersionHistory({ versions, currentVersion }: VersionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<[string | null, string | null]>([null, null])
  const [showDiff, setShowDiff] = useState(false)
  const [viewingVersion, setViewingVersion] = useState<string | null>(null)

  // Sortable version list
  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => b.version_number - a.version_number)
  }, [versions])

  const handleVersionSelect = (versionId: string, slot: 0 | 1) => {
    setSelectedVersions(prev => {
      const newSelection = [...prev] as [string | null, string | null]
      newSelection[slot] = versionId
      return newSelection
    })
  }

  const canCompare = selectedVersions[0] && selectedVersions[1] && selectedVersions[0] !== selectedVersions[1]

  const getVersionById = (id: string | null) => {
    if (!id) return null
    return versions.find(v => v.id === id)
  }

  const renderVersionSnapshot = (snapshot: unknown) => {
    if (!snapshot || typeof snapshot !== "object") return null
    const data = snapshot as Record<string, unknown>

    const fields = [
      { key: "title", label: "Title" },
      { key: "user_story", label: "User Story" },
      { key: "acceptance_criteria", label: "Acceptance Criteria" },
      { key: "success_metrics", label: "Success Metrics" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
    ]

    return (
      <dl className="space-y-3">
        {fields.map(({ key, label }) => {
          const value = data[key]
          if (!value) return null
          return (
            <div key={key}>
              <dt className="text-xs font-medium text-muted-foreground uppercase">{label}</dt>
              <dd className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                {String(value)}
              </dd>
            </div>
          )
        })}
      </dl>
    )
  }

  const renderDiffComparison = () => {
    const oldVersion = getVersionById(selectedVersions[0])
    const newVersion = getVersionById(selectedVersions[1])

    if (!oldVersion || !newVersion) return null

    const oldSnapshot = oldVersion.snapshot as Record<string, unknown>
    const newSnapshot = newVersion.snapshot as Record<string, unknown>

    const fieldsToCompare = [
      { key: "title", label: "Title", type: "words" as const },
      { key: "user_story", label: "User Story", type: "lines" as const },
      { key: "acceptance_criteria", label: "Acceptance Criteria", type: "lines" as const },
      { key: "success_metrics", label: "Success Metrics", type: "lines" as const },
      { key: "status", label: "Status", type: "words" as const },
      { key: "priority", label: "Priority", type: "words" as const },
      { key: "internal_notes", label: "Internal Notes", type: "lines" as const },
    ]

    const changedFields = fieldsToCompare.filter(
      ({ key }) => String(oldSnapshot[key] || "") !== String(newSnapshot[key] || "")
    )

    if (changedFields.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">
          No differences found between these versions.
        </p>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Comparing v{oldVersion.version_number} → v{newVersion.version_number}
          </span>
          <span className="text-muted-foreground">
            {changedFields.length} field{changedFields.length !== 1 ? "s" : ""} changed
          </span>
        </div>
        {changedFields.map(({ key, label, type }) => (
          <div key={key} className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">{label}</h4>
            <DiffView
              oldText={String(oldSnapshot[key] || "")}
              newText={String(newSnapshot[key] || "")}
              type={type}
            />
          </div>
        ))}
      </div>
    )
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="rounded-lg bg-card shadow-sm border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Version History
        </h2>
        <p className="text-sm text-muted-foreground">No version history available.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-card shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Version History</h2>
          <span className="text-sm text-muted-foreground">
            ({versions.length} version{versions.length !== 1 ? "s" : ""})
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-border pt-4 space-y-4">
          {/* Compare Mode Toggle */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Current: v{currentVersion}</span>
            {versions.length >= 2 && (
              <button
                onClick={() => {
                  setShowDiff(!showDiff)
                  if (!showDiff) {
                    // Pre-select latest two versions
                    setSelectedVersions([
                      sortedVersions[1]?.id || null,
                      sortedVersions[0]?.id || null,
                    ])
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  showDiff
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <GitCompare className="h-4 w-4" />
                Compare Versions
              </button>
            )}
          </div>

          {/* Compare Mode UI */}
          {showDiff && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    From (Older)
                  </label>
                  <select
                    value={selectedVersions[0] || ""}
                    onChange={(e) => handleVersionSelect(e.target.value, 0)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select version</option>
                    {sortedVersions.map((v) => (
                      <option key={v.id} value={v.id} disabled={v.id === selectedVersions[1]}>
                        v{v.version_number} - {new Date(v.changed_at).toLocaleDateString()}
                        {v.is_baseline ? ` (${v.baseline_name || "Baseline"})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    To (Newer)
                  </label>
                  <select
                    value={selectedVersions[1] || ""}
                    onChange={(e) => handleVersionSelect(e.target.value, 1)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select version</option>
                    {sortedVersions.map((v) => (
                      <option key={v.id} value={v.id} disabled={v.id === selectedVersions[0]}>
                        v{v.version_number} - {new Date(v.changed_at).toLocaleDateString()}
                        {v.is_baseline ? ` (${v.baseline_name || "Baseline"})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Diff Output */}
              {canCompare && renderDiffComparison()}
            </div>
          )}

          {/* Version List */}
          <ul className="space-y-2">
            {sortedVersions.map((version) => (
              <li
                key={version.id}
                className="flex items-start justify-between gap-2 p-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      v{version.version_number}
                    </span>
                    {version.is_baseline && (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        <Tag className="h-3 w-3" />
                        {version.baseline_name || "Baseline"}
                      </span>
                    )}
                    {version.version_number === currentVersion && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  {version.change_summary && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {version.change_summary}
                    </p>
                  )}
                  {version.changed_fields && version.changed_fields.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Changed: {version.changed_fields.join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(version.changed_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setViewingVersion(viewingVersion === version.id ? null : version.id)}
                  className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  title="View snapshot"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          {/* Version Snapshot Modal */}
          {viewingVersion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setViewingVersion(null)}
              />
              <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-auto rounded-lg bg-card shadow-lg border border-border">
                <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-card border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">
                    Version {getVersionById(viewingVersion)?.version_number} Snapshot
                  </h3>
                  <button
                    onClick={() => setViewingVersion(null)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  {renderVersionSnapshot(getVersionById(viewingVersion)?.snapshot)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
