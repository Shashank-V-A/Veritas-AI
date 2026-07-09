import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { queryKeys } from '@/lib/queryKeys'
import { formatRelativeDate } from '@/lib/format'
import { getSourceTypeLabel } from '@/lib/sourceTypes'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import type { HistoryItem } from '@/types'
import { TrustScoreBadge } from '@/components/analysis/TrustScoreBadge'
import { Badge } from '@/components/ui/badge'

interface AnalysisCardProps {
  item: HistoryItem
  index?: number
  className?: string
}

export function AnalysisCard({ item, index = 0, className }: AnalysisCardProps) {
  const title = item.title ?? item.preview
  const queryClient = useQueryClient()

  function handlePrefetch() {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.report(item.id),
      queryFn: () => api.getReport(item.id),
      staleTime: 60_000,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        to={ROUTES.analysis(item.id)}
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        className={cn(
          'group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border hover:bg-surface-secondary/50',
          className,
        )}
      >
        <TrustScoreBadge score={item.trustScore} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {title}
            </p>
            <Badge
              variant="outline"
              className="hidden shrink-0 border-border text-[10px] text-muted-foreground sm:inline-flex"
            >
              {getSourceTypeLabel(item.sourceType)}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.preview}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {formatRelativeDate(item.createdAt)}
          </p>
        </div>

        <ChevronRight
          className="size-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
          strokeWidth={1.75}
        />
      </Link>
    </motion.div>
  )
}
