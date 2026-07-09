import { ArrowRight, History } from 'lucide-react'
import { getVerdictLabel } from '@/lib/format'
import type { Verdict } from '@veritas/shared'

interface VerdictChangelogProps {
  previousTrustScore: number
  currentTrustScore: number
  previousVerdict?: Verdict
  currentVerdict: Verdict
  parentId?: string
}

export function VerdictChangelog({
  previousTrustScore,
  currentTrustScore,
  previousVerdict,
  currentVerdict,
}: VerdictChangelogProps) {
  const scoreDelta = currentTrustScore - previousTrustScore
  const deltaLabel =
    scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta === 0 ? '±0' : String(scoreDelta)

  return (
    <div className="dossier-panel border-l-2 border-l-accent-secondary p-4 md:p-5">
      <div className="flex items-center gap-2">
        <History className="size-4 text-accent-secondary" strokeWidth={1.5} />
        <p className="font-mono text-xs text-card-foreground/60">Re-analysis changelog</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-card-foreground/85">
        <span className="font-mono tabular-nums">{previousTrustScore}</span>
        <ArrowRight className="size-3.5 text-card-foreground/40" />
        <span className="font-mono tabular-nums font-medium">{currentTrustScore}</span>
        <span
          className={
            scoreDelta > 0
              ? 'text-success'
              : scoreDelta < 0
                ? 'text-danger'
                : 'text-card-foreground/55'
          }
        >
          ({deltaLabel})
        </span>
      </div>
      {previousVerdict && previousVerdict !== currentVerdict && (
        <p className="mt-2 text-xs text-card-foreground/60">
          Verdict changed from {getVerdictLabel(previousVerdict)} to{' '}
          {getVerdictLabel(currentVerdict)}
        </p>
      )}
    </div>
  )
}
