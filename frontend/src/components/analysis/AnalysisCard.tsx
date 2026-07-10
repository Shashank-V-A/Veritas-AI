import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Loader2, Trash2 } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { formatCaseId } from '@/lib/caseId'
import { queryKeys } from '@/lib/queryKeys'
import { getCategoryLabel } from '@/lib/categories'
import { getFriendlyErrorMessage } from '@/lib/errorMessages'
import { formatRelativeDate, getVerdictLabel } from '@/lib/format'
import { getSourceTypeLabel } from '@/lib/sourceTypes'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import type { HistoryItem } from '@/types'
import { TrustScoreBadge } from '@/components/analysis/TrustScoreBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeleteReport } from '@/hooks/useDeleteReport'

interface AnalysisCardProps {
  item: HistoryItem
  index?: number
  className?: string
}

export function AnalysisCard({ item, index = 0, className }: AnalysisCardProps) {
  const title = item.title ?? item.preview
  const queryClient = useQueryClient()
  const deleteReport = useDeleteReport({ redirect: false })
  const [confirming, setConfirming] = useState(false)

  function handlePrefetch() {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.report(item.id),
      queryFn: () => api.getReport(item.id),
      staleTime: 60_000,
    })
  }

  function requestDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setConfirming(true)
  }

  function cancelDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setConfirming(false)
  }

  function confirmDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    deleteReport.mutate(item.id, {
      onSettled: () => setConfirming(false),
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={cn(
        'group relative z-10 flex flex-col border border-accent/20 bg-accent/5 transition-all hover:border-accent/40 hover:bg-accent/10',
        className,
      )}
    >
      <div className="flex items-stretch">
        <Link
          to={ROUTES.analysis(item.id)}
          onMouseEnter={handlePrefetch}
          onFocus={handlePrefetch}
          className="flex min-w-0 flex-1 items-center gap-4 p-4"
        >
          <TrustScoreBadge score={item.trustScore} />

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] text-card-foreground/45">
              {formatCaseId(item.id)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-card-foreground">
                {title}
              </p>
              {item.verdict && (
                <Badge
                  variant="outline"
                  className="hidden shrink-0 border-accent/25 text-[10px] text-card-foreground/70 sm:inline-flex"
                >
                  {getVerdictLabel(item.verdict)}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="hidden shrink-0 border-accent/25 text-[10px] text-card-foreground/70 sm:inline-flex"
              >
                {getSourceTypeLabel(item.sourceType)}
              </Badge>
              {item.category && (
                <Badge
                  variant="outline"
                  className="hidden shrink-0 border-accent/25 text-[10px] text-card-foreground/70 md:inline-flex"
                >
                  {getCategoryLabel(item.category)}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-card-foreground/60">
              {item.preview}
            </p>
            <p className="mt-1 text-[11px] text-card-foreground/45">
              {formatRelativeDate(item.createdAt)}
            </p>
          </div>

          <ChevronRight
            className="size-4 shrink-0 text-card-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
            strokeWidth={1.75}
          />
        </Link>

        <div className="flex items-center border-l border-accent/15 px-1.5">
          <button
            type="button"
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors',
              'hover:bg-danger/10 hover:text-danger',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40',
              'disabled:pointer-events-none disabled:opacity-45',
            )}
            onClick={requestDelete}
            disabled={deleteReport.isPending}
            aria-label={`Delete case file ${formatCaseId(item.id)}`}
            title="Delete case file"
          >
            {deleteReport.isPending ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Trash2 className="size-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {confirming && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-danger/25 bg-danger/5 px-4 py-2.5">
          <p className="text-xs text-foreground">
            Delete this case file permanently?
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={cancelDelete}
              disabled={deleteReport.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 border-danger/40 bg-danger text-white hover:bg-danger/90"
              onClick={confirmDelete}
              disabled={deleteReport.isPending}
            >
              {deleteReport.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      )}

      {deleteReport.isError && (
        <p className="border-t border-danger/20 px-4 py-2 text-xs text-danger" role="alert">
          {getFriendlyErrorMessage(deleteReport.error)}
        </p>
      )}
    </motion.div>
  )
}
