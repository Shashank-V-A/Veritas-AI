import { motion } from 'framer-motion'
import { CHART_COLORS } from '@/lib/chartColors'
import { getTrustScoreColor } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface TrustScoreRingProps {
  score: number
  className?: string
}

export function TrustScoreRing({ score, className }: TrustScoreRingProps) {
  const reducedMotion = useReducedMotion()
  const radius = 72
  const stroke = 8
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const progress = Math.min(100, Math.max(0, score))
  const strokeDashoffset =
    circumference - (progress / 100) * circumference

  const ringColor =
    score >= 70
      ? CHART_COLORS.success
      : score >= 40
        ? CHART_COLORS.warning
        : CHART_COLORS.danger

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      role="img"
      aria-label={`Trust score ${score} out of 100`}
    >
      <div className="relative size-44">
        <svg
          className="size-full -rotate-90"
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        >
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={CHART_COLORS.grid}
            strokeWidth={stroke}
          />
          <motion.circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={
              reducedMotion
                ? { strokeDashoffset }
                : { strokeDashoffset: circumference }
            }
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn('text-4xl font-semibold tabular-nums', getTrustScoreColor(score))}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {score}
          </motion.span>
          <span className="text-[11px] uppercase tracking-widest text-muted">
            Trust score
          </span>
        </div>
      </div>
    </div>
  )
}
