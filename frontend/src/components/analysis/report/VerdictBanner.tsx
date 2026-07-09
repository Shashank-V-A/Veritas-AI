import { motion } from 'framer-motion'
import type { Verdict } from '@veritas/shared'
import { getVerdictLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface VerdictBannerProps {
  verdict: Verdict
  caseId: string
  className?: string
}

const verdictStyles: Record<Verdict, string> = {
  credible: 'bg-success/15 border-success/40 text-success',
  mixed: 'bg-warning/15 border-warning/40 text-warning',
  misleading: 'bg-danger/15 border-danger/50 text-danger',
  unsupported: 'bg-card-foreground/10 border-card-foreground/30 text-card-foreground',
}

export function VerdictBanner({ verdict, caseId, className }: VerdictBannerProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col gap-3 border-2 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8',
        verdictStyles[verdict],
        className,
      )}
    >
      <div>
        <p className="font-mono text-[10px] opacity-70">Final determination</p>
        <p className="font-display text-3xl md:text-4xl">{getVerdictLabel(verdict)}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-[10px] opacity-70">Case file</p>
        <p className="font-mono text-sm">{caseId}</p>
      </div>
    </motion.div>
  )
}
