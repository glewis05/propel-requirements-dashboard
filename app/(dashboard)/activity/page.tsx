import { Metadata } from "next"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { getRecentActivities } from "./actions"

export const metadata: Metadata = {
  title: "Activity | Propel Requirements Dashboard",
  description: "Recent activity across all stories",
}

export default async function ActivityPage() {
  const result = await getRecentActivities(100)
  const activities = result.success ? result.activities : []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Feed</h1>
        <p className="text-muted-foreground mt-1">
          See what&apos;s happening across all stories and programs
        </p>
      </div>

      {/* Activity Feed */}
      <div className="bg-card border border-border rounded-lg p-6">
        <ActivityFeed initialActivities={activities} limit={100} showHeader={false} />
      </div>
    </div>
  )
}
