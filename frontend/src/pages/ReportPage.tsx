import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { slideUp } from '@/animations/variants'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/constants'
import { useReport } from '@/hooks/useHistory'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const ReportView = lazy(() =>
  import('@/components/analysis/report/ReportView').then((m) => ({
    default: m.ReportView,
  })),
)

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 shimmer" />
      <Skeleton className="h-4 w-72 shimmer" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl shimmer" />
        <Skeleton className="h-56 rounded-xl shimmer" />
      </div>
      <Skeleton className="h-32 rounded-xl shimmer" />
      <Skeleton className="h-32 rounded-xl shimmer" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl shimmer" />
        <Skeleton className="h-64 rounded-xl shimmer" />
      </div>
    </div>
  )
}

export function ReportPage() {
  const { id = '' } = useParams<{ id: string }>()
  const reducedMotion = useReducedMotion()
  const { data, isLoading, isError } = useReport(id)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <motion.div
        variants={reducedMotion ? undefined : slideUp}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
          <Link to={ROUTES.dashboard}>
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </Button>

        {isLoading && <ReportSkeleton />}

        {isError && (
          <Card className="border-border bg-surface">
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium text-foreground">
                Report not found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This analysis may have been deleted or the link is invalid.
              </p>
            </CardContent>
          </Card>
        )}

        {data && (
          <Suspense fallback={<ReportSkeleton />}>
            <ReportView record={data} />
          </Suspense>
        )}
      </motion.div>
    </div>
  )
}
