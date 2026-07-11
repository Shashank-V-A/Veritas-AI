import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CHART_COLORS } from '@/lib/chartColors'
import type { BiasAnalysis } from '@/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface BiasMeterProps {
  bias: BiasAnalysis
}

const BIAS_DIMENSIONS = [
  { key: 'political' as const, labelKey: 'report.biasPolitical' },
  { key: 'commercial' as const, labelKey: 'report.biasCommercial' },
  { key: 'ideological' as const, labelKey: 'report.biasIdeological' },
]

function BiasBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const reducedMotion = useReducedMotion()
  const color =
    value >= 60 ? CHART_COLORS.danger : value >= 35 ? CHART_COLORS.warning : CHART_COLORS.accent

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={reducedMotion ? { width: `${value}%` } : { width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  )
}

export function BiasMeter({ bias }: BiasMeterProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-surface-secondary/40 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">{t('report.biasOverall')}</span>
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {bias.overall}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {BIAS_DIMENSIONS.map((dim, index) => (
          <BiasBar
            key={dim.key}
            label={t(dim.labelKey)}
            value={bias[dim.key]}
            delay={0.1 + index * 0.1}
          />
        ))}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {bias.explanation}
      </p>
    </div>
  )
}
