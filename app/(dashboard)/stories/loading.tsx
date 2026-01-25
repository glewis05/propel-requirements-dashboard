import { Skeleton, SkeletonText, SkeletonStoriesTable } from "@/components/ui/skeleton"

export default function StoriesLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <SkeletonText className="w-64" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Filter status bar skeleton */}
      <div className="flex items-center justify-between">
        <SkeletonText className="w-40" />
      </div>

      {/* Table Skeleton */}
      <SkeletonStoriesTable />
    </div>
  )
}
