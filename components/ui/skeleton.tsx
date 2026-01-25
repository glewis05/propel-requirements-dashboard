interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
    />
  )
}

export function SkeletonText({ className = "" }: SkeletonProps) {
  return <Skeleton className={`h-4 ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg bg-card p-6 shadow-sm border border-border">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2 flex-1">
          <SkeletonText className="w-24" />
          <SkeletonText className="w-16" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-border">
      <td className="px-6 py-4">
        <div className="space-y-2">
          <SkeletonText className="w-48" />
          <SkeletonText className="w-24" />
        </div>
      </td>
      <td className="px-6 py-4">
        <SkeletonText className="w-20" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-24 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <SkeletonText className="w-16" />
      </td>
      <td className="px-6 py-4">
        <SkeletonText className="w-20" />
      </td>
    </tr>
  )
}

export function SkeletonStoriesTable() {
  return (
    <div className="rounded-lg bg-card shadow-sm border border-border overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Story
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Program
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Roadmap
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonStatsGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
