import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { slideUp } from '@/animations/variants'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/constants'
import { usePublicReport } from '@/hooks/useHistory'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { getOgImageUrl } from '@/services/api'
import type { AnalysisRecord } from '@veritas/shared'
import type { PublicReportResponse } from '@veritas/shared'

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
    </div>
  )
}

function toAnalysisRecord(data: PublicReportResponse): AnalysisRecord {
  return {
    id: data.id,
    title: data.title,
    content: data.content ?? '',
    sourceType: data.sourceType,
    category: data.category,
    trustScore: data.trustScore,
    report: data.report,
    createdAt: data.createdAt,
    meshModel: data.meshModel,
    meshLatencyMs: data.meshLatencyMs,
  }
}

export function PublicReportPage() {
  const { token = '' } = useParams<{ token: string }>()
  const reducedMotion = useReducedMotion()
  const { data, isLoading, isError } = usePublicReport(token)

  const pageTitle = data?.title
    ? `${data.title} — Veritas AI`
    : 'Shared dossier — Veritas AI'
  const description = data?.report.summary ?? 'Forensic credibility dossier from Veritas AI'
  const ogImage = token ? getOgImageUrl(token) : undefined

  return (
    <div className="min-h-svh bg-surface">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
        <motion.div
          variants={reducedMotion ? undefined : slideUp}
          initial={reducedMotion ? false : 'hidden'}
          animate={reducedMotion ? false : 'visible'}
        >
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-accent" asChild>
              <Link to={ROUTES.home} aria-label="Back to Veritas AI home">
                <ArrowLeft className="size-4" />
                Veritas AI
              </Link>
            </Button>
            <span className="stamp border-accent-secondary text-accent-secondary text-[10px]">
              Shared dossier
            </span>
          </div>

          {isLoading && <ReportSkeleton />}

          {isError && (
            <Card className="border-border bg-surface">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-foreground">Report not found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This shared link may have expired or is invalid.
                </p>
              </CardContent>
            </Card>
          )}

          {data && (
            <Suspense fallback={<ReportSkeleton />}>
              <ReportView record={toAnalysisRecord(data)} readOnly />
            </Suspense>
          )}
        </motion.div>
      </div>
    </div>
  )
}
