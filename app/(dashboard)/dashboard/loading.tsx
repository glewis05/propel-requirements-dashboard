import { Skeleton, SkeletonText, SkeletonStatsGrid, SkeletonTableRow } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <SkeletonText className="w-64" />
      </div>

      {/* Stats Grid Skeleton */}
      <SkeletonStatsGrid />

      {/* Recent Stories Skeleton */}
      <div className="rounded-lg bg-card shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1 min-w-0 space-y-2">
                <SkeletonText className="w-64" />
                <div className="flex items-center gap-2">
                  <SkeletonText className="w-24" />
                  <SkeletonText className="w-16" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
