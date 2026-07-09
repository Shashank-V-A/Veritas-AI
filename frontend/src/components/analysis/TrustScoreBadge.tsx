import { cn } from '@/lib/utils'
import { getTrustScoreBg, getTrustScoreColor } from '@/lib/format'

interface TrustScoreBadgeProps {
  score: number
  size?: 'sm' | 'md'
  className?: string
}

export function TrustScoreBadge({
  score,
  size = 'sm',
  className,
}: TrustScoreBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-medium tabular-nums',
        getTrustScoreBg(score),
        size === 'sm' ? 'size-9 text-xs' : 'size-12 text-sm',
        className,
      )}
      aria-label={`Trust score ${score} out of 100`}
    >
      <span className={getTrustScoreColor(score)}>{score}</span>
    </div>
  )
}
