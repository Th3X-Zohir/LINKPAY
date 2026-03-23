export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 ${className || ''}`}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

export function PaymentLinkCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  )
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100">
      <div className="space-y-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="text-right space-y-1">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  )
}