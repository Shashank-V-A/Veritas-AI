import { FolderOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

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
        <FolderOpen className="size-3.5 shrink-0 text-accent" strokeWidth={1.5} />
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
          {t('dashboard.caseSample')} · {category}
        </p>
      </div>
      <p className="mt-2.5 font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
        {label}
      </p>
      <div className="mt-3 flex items-baseline gap-2.5">
        <span
          className={cn(
            'font-sans text-2xl font-semibold tabular-nums leading-none',
            getTrustScoreColor(trustScore),
          )}
        >
          {trustScore}
        </span>
        <span className="font-sans text-[12px] text-muted-foreground">
          {t('dashboard.trust')} · {riskLabel}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 font-sans text-sm leading-relaxed text-muted-foreground">
        {prefill.content}
      </p>
    </button>
  )
}
