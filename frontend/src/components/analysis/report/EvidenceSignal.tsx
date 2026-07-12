import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { CredibilityReport } from '@veritas/shared'

interface EvidenceSignalProps {
  report: CredibilityReport
  meshModel?: string | null
  className?: string
}

export type EvidenceStrength = 'strong' | 'moderate' | 'thin'

export function computeEvidenceStrength(
  report: CredibilityReport,
  meshModel?: string | null,
): EvidenceStrength {
  const searchHits = report.searchQueryCount ?? 0
  const lineage = report.sourceLineage?.length ?? 0
  const reading = report.suggestedReading?.length ?? 0
  const interval = report.confidenceInterval
  const intervalWidth =
    interval != null ? Math.abs(interval.high - interval.low) : 24
  const isStub = !meshModel || /stub|mock|demo/i.test(meshModel)

  let score = 0
  if (searchHits >= 4) score += 2
  else if (searchHits >= 2) score += 1
  if (lineage + reading >= 3) score += 2
  else if (lineage + reading >= 1) score += 1
  if (intervalWidth <= 16) score += 1
  if (isStub) score -= 2

  if (score >= 4) return 'strong'
  if (score >= 2) return 'moderate'
  return 'thin'
}

export function EvidenceSignal({ report, meshModel, className }: EvidenceSignalProps) {
  const { t } = useTranslation()
  const strength = computeEvidenceStrength(report, meshModel)
  const searchHits = report.searchQueryCount ?? 0

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 border px-3 py-2',
        strength === 'thin'
          ? 'border-danger/40 bg-danger/5'
          : strength === 'moderate'
            ? 'border-accent/30 bg-accent/5'
            : 'border-success/30 bg-success/5',
        className,
      )}
      role="status"
    >
      {strength === 'thin' ? (
        <AlertTriangle className="size-4 shrink-0 text-danger" strokeWidth={1.5} />
      ) : (
        <ShieldCheck
          className={cn(
            'size-4 shrink-0',
            strength === 'strong' ? 'text-success' : 'text-accent',
          )}
          strokeWidth={1.5}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t('report.evidenceSignal')}
        </p>
        <p className="text-sm text-foreground">
          {t(`report.evidenceStrength.${strength}`)}
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          {t('report.evidenceSignalDetail', { count: searchHits })}
        </p>
      </div>
    </div>
  )
}
