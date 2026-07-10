import { FolderOpen } from 'lucide-react'
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
        'pressable group relative w-full rounded-md border p-4 text-left transition-colors duration-200',
        isActive
          ? 'border-accent/50 bg-accent/10'
          : 'border-border bg-surface hover:border-accent/35 hover:bg-elevated',
      )}
    >
      <div className="flex items-center gap-2">
        <FolderOpen className="size-3.5 text-accent" strokeWidth={1.5} />
        <p className="meta-label">Case sample · {category}</p>
      </div>
      <p className="mt-2 font-display text-base text-foreground">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <span className={cn('font-display text-xl tabular-nums', getTrustScoreColor(trustScore))}>
          {trustScore}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          Trust · {riskLabel}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {prefill.content}
      </p>
    </button>
  )
}
