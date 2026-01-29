import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { checkCycleAccess, getAcknowledgmentStatus } from "@/app/tester/acknowledgment-actions"
import { getCycleById } from "@/app/(dashboard)/uat/cycles/cycle-actions"
import { AcknowledgmentForm } from "@/components/tester/AcknowledgmentForm"

interface AcknowledgePageProps {
  params: Promise<{ cycleId: string }>
}

export default async function AcknowledgePage({ params }: AcknowledgePageProps) {
  const { cycleId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/tester")
  }

  // Check if user has access to this cycle
  const accessResult = await checkCycleAccess(cycleId)

  if (!accessResult.success || !accessResult.hasAccess) {
    notFound()
  }

  // Check if already acknowledged
  const ackResult = await getAcknowledgmentStatus(cycleId)
  if (ackResult.success && ackResult.hasAcknowledged) {
    // Already acknowledged, redirect to cycle dashboard
    redirect(`/tester/cycle/${cycleId}`)
  }

  // Get cycle details
  const cycleResult = await getCycleById(cycleId)
  if (!cycleResult.success || !cycleResult.cycle) {
    notFound()
  }

  return (
    <div className="py-8">
      <AcknowledgmentForm
        cycleId={cycleId}
        cycleName={cycleResult.cycle.name}
      />
    </div>
  )
}
