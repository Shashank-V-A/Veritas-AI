import { cn } from '@/lib/utils'
import { formatRelativeDate, getTrustScoreColor } from '@/lib/format'
import type { HistoryItem } from '@/types'

interface MissionControlProps {
  total: number
  items: HistoryItem[]
}

export function MissionControl({ total, items }: MissionControlProps) {
  if (total === 0) return null

  const lastCase = items[0]
  const avgTrust =
    items.length > 0
      ? Math.round(items.reduce((sum, item) => sum + item.trustScore, 0) / items.length)
      : 0

  return (
    <div className="mt-6 flex flex-wrap gap-8 border-t border-border pt-5">
      <div>
        <p className="font-display text-3xl tabular-nums text-accent">{total}</p>
        <p className="meta-label mt-1">Case files opened</p>
      </div>
      {lastCase && (
        <div>
          <p className="font-display text-3xl text-foreground">
            {formatRelativeDate(lastCase.createdAt)}
          </p>
          <p className="meta-label mt-1">Last case filed</p>
        </div>
      )}
      <div>
        <p className={cn('font-display text-3xl tabular-nums', getTrustScoreColor(avgTrust))}>
          {avgTrust}
        </p>
        <p className="meta-label mt-1">Avg. trust score</p>
      </div>
    </div>
  )
}
