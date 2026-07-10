import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
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
  credible: 'border-success/40 bg-success/10 text-success',
  mixed: 'border-warning/40 bg-warning/10 text-warning',
  misleading: 'border-danger/45 bg-danger/10 text-danger',
  unsupported: 'border-border bg-elevated text-muted-foreground',
}

export function VerdictBanner({ verdict, caseId, className }: VerdictBannerProps) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={cn(
        'intel-panel flex flex-col gap-3 border px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8',
        verdictStyles[verdict],
        className,
      )}
    >
      <div>
        <p className="meta-label opacity-80">{t('report.finalDetermination')}</p>
        <p className="mt-1 font-display text-3xl md:text-4xl">{getVerdictLabel(verdict)}</p>
      </div>
      <div className="md:text-right">
        <p className="meta-label opacity-80">{t('report.caseFile')}</p>
        <p className="mt-1 font-mono text-sm tracking-wide">{caseId}</p>
      </div>
    </motion.div>
  )
}
