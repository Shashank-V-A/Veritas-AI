import { Skeleton } from '@/components/ui/skeleton'

export function RouteFallback() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-10 md:px-8">
      <Skeleton className="mb-6 h-8 w-48" />
      <Skeleton className="mb-4 h-4 w-72" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

export function DashboardRouteFallback() {
  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Skeleton className="hidden h-full w-64 shrink-0 md:block" />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  )
}
