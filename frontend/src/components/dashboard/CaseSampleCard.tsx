import { cn } from '@/lib/utils'
import { getTrustScoreColor } from '@/lib/format'
import type { AnalysisPrefill } from '@/lib/sampleReport'

interface CaseSampleCardProps {
  category: string
  label: string
  trustScore: number
  riskLabel: string
  prefill: AnalysisPrefill
  isActive?: boolean
  onSelect: (prefill: AnalysisPrefill) => void
}

export function CaseSampleCard({
  category,
  label,
  trustScore,
  riskLabel,
  prefill,
  isActive,
  onSelect,
}: CaseSampleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(prefill)}
      className={cn(
        'group relative w-full border p-4 text-left transition-all',
        isActive
          ? 'border-accent-secondary/50 bg-accent/10'
          : 'border-accent/20 bg-accent/5 hover:border-accent/40 hover:bg-accent/10',
      )}
    >
      <p className="font-mono text-[10px] text-accent-secondary/80">
        Case sample · {category}
      </p>
      <p className="mt-2 font-display text-base text-card-foreground group-hover:text-card-foreground">
        {label}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span className={cn('font-display text-xl tabular-nums', getTrustScoreColor(trustScore))}>
          {trustScore}
        </span>
        <span className="font-mono text-[10px] text-card-foreground/50">
          Trust · {riskLabel}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-card-foreground/55">
        {prefill.content}
      </p>
    </button>
  )
}
