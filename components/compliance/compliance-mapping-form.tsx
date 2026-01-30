"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Plus, Trash2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { ComplianceBadge } from "./compliance-badge"
import { ComplianceStatusBadge } from "./compliance-status-badge"
import { COMPLIANCE_STATUS_CONFIG } from "@/lib/compliance/constants"
import { updateComplianceMappingSchema } from "@/lib/validations/compliance"
import type { UpdateComplianceMappingData } from "@/lib/validations/compliance"
import type { StoryComplianceMappingWithDetails, ComplianceStatus, EvidenceLink } from "@/types/compliance"
import { updateComplianceMapping, verifyComplianceMapping, deleteComplianceMapping } from "@/app/(dashboard)/compliance/actions"

interface ComplianceMappingFormProps {
  mapping: StoryComplianceMappingWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
  canVerify?: boolean
  canDelete?: boolean
}

export function ComplianceMappingForm({
  mapping,
  open,
  onOpenChange,
  canVerify = false,
  canDelete = false,
}: ComplianceMappingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evidenceLinks, setEvidenceLinks] = useState<EvidenceLink[]>(
    mapping.evidence_links || []
  )
  const [newEvidenceUrl, setNewEvidenceUrl] = useState("")
  const [newEvidenceDesc, setNewEvidenceDesc] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateComplianceMappingData>({
    resolver: zodResolver(updateComplianceMappingSchema),
    defaultValues: {
      status: mapping.status,
      implementation_notes: mapping.implementation_notes || "",
      target_date: mapping.target_date || "",
      risk_assessment: mapping.risk_assessment || "",
    },
  })

  const currentStatus = watch("status")

  const handleAddEvidence = () => {
    if (!newEvidenceUrl || !newEvidenceDesc) return

    const newLink: EvidenceLink = {
      url: newEvidenceUrl,
      description: newEvidenceDesc,
      uploaded_at: new Date().toISOString(),
    }
    setEvidenceLinks([...evidenceLinks, newLink])
    setNewEvidenceUrl("")
    setNewEvidenceDesc("")
  }

  const handleRemoveEvidence = (index: number) => {
    setEvidenceLinks(evidenceLinks.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: UpdateComplianceMappingData) => {
    setLoading(true)
    setError(null)

    const result = await updateComplianceMapping(mapping.mapping_id, {
      ...data,
      evidence_links: evidenceLinks,
    })

    setLoading(false)

    if (result.success) {
      onOpenChange(false)
      router.refresh()
    } else {
      setError(result.error || "Failed to update mapping")
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    setError(null)

    const result = await verifyComplianceMapping(mapping.mapping_id)

    setVerifying(false)

    if (result.success) {
      onOpenChange(false)
      router.refresh()
    } else {
      setError(result.error || "Failed to verify mapping")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this compliance mapping?")) {
      return
    }

    setDeleting(true)
    setError(null)

    const result = await deleteComplianceMapping(mapping.mapping_id)

    setDeleting(false)

    if (result.success) {
      onOpenChange(false)
      router.refresh()
    } else {
      setError(result.error || "Failed to delete mapping")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono">{mapping.control_code}</span>
            {mapping.framework_code && (
              <ComplianceBadge frameworkCode={mapping.framework_code} size="sm" />
            )}
          </DialogTitle>
          <DialogDescription>
            {mapping.control_title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={currentStatus}
              onValueChange={(value) => setValue("status", value as ComplianceStatus, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COMPLIANCE_STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          config.bgColor,
                          config.borderColor,
                          "border"
                        )}
                      />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mapping.verified_at && (
              <p className="text-xs text-green-600">
                Verified by {mapping.verified_by_name} on{" "}
                {new Date(mapping.verified_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date</Label>
            <Input
              id="target_date"
              type="date"
              {...register("target_date")}
            />
          </div>

          {/* Implementation Notes */}
          <div className="space-y-2">
            <Label htmlFor="implementation_notes">Implementation Notes</Label>
            <Textarea
              id="implementation_notes"
              placeholder="Describe how this control is implemented..."
              rows={4}
              {...register("implementation_notes")}
            />
            {errors.implementation_notes && (
              <p className="text-sm text-destructive">{errors.implementation_notes.message}</p>
            )}
          </div>

          {/* Risk Assessment */}
          <div className="space-y-2">
            <Label htmlFor="risk_assessment">Risk Assessment</Label>
            <Textarea
              id="risk_assessment"
              placeholder="Document any risks or mitigations..."
              rows={2}
              {...register("risk_assessment")}
            />
          </div>

          {/* Evidence Links */}
          <div className="space-y-2">
            <Label>Evidence Links</Label>
            <div className="space-y-2">
              {evidenceLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded border bg-muted/30"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      {link.description}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEvidence(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="URL"
                value={newEvidenceUrl}
                onChange={(e) => setNewEvidenceUrl(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Description"
                value={newEvidenceDesc}
                onChange={(e) => setNewEvidenceDesc(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEvidence}
                disabled={!newEvidenceUrl || !newEvidenceDesc}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {canDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="sm:mr-auto"
              >
                {deleting ? "Removing..." : "Remove Mapping"}
              </Button>
            )}

            {canVerify && currentStatus === "implemented" && !mapping.verified_at && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? "Verifying..." : "Mark as Verified"}
              </Button>
            )}

            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isDirty}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
