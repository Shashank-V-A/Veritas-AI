import type { ConfidenceInterval } from '@veritas/shared'
import { cn } from '@/lib/utils'

interface ConfidenceIntervalBarProps {
  score: number
  interval: ConfidenceInterval
  className?: string
}

export function ConfidenceIntervalBar({
  score,
  interval,
  className,
}: ConfidenceIntervalBarProps) {
  const low = Math.max(0, Math.min(100, interval.low))
  const high = Math.max(0, Math.min(100, interval.high))
  const point = Math.max(0, Math.min(100, score))

  return (
    <div className={cn('space-y-2', className)} role="img" aria-label={`Trust score range ${low} to ${high}`}>
      <div className="relative h-3 overflow-hidden border border-accent/20 bg-accent/10">
        <div
          className="absolute inset-y-0 bg-accent/25"
          style={{ left: `${low}%`, width: `${high - low}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-accent-secondary"
          style={{ left: `${point}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="flex justify-between font-mono text-[10px] text-card-foreground/55">
        <span>{low}</span>
        <span className="text-card-foreground/75">
          Score <span className="tabular-nums text-accent-secondary">{point}</span>
        </span>
        <span>{high}</span>
      </div>

      <p className="font-mono text-[10px] text-card-foreground/45">
        Method · {interval.method}
      </p>
    </div>
  )
}
