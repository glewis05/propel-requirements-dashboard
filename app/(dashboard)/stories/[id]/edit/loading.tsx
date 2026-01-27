import { Skeleton } from "@/components/ui/skeleton"

export default function EditStoryLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link skeleton */}
      <Skeleton className="h-5 w-32" />

      {/* Page Header skeleton */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      {/* Lock status skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Form skeleton */}
      <div className="rounded-lg bg-card shadow-sm border border-border p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>

      <div className="rounded-lg bg-card shadow-sm border border-border p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>

      <div className="rounded-lg bg-card shadow-sm border border-border p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}
