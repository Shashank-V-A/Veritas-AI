import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CHART_COLORS } from '@/lib/chartColors'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface TrustScoreRingProps {
  score: number
  className?: string
  variant?: 'default' | 'seal'
}

function useCountUp(target: number, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }

    let start: number | null = null
    let frame: number

    const step = (timestamp: number) => {
      if (start === null) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, enabled])

  return value
}

export function TrustScoreRing({
  score,
  className,
  variant = 'default',
}: TrustScoreRingProps) {
  const reducedMotion = useReducedMotion()
  const displayScore = useCountUp(score, 1200, !reducedMotion)

  const radius = variant === 'seal' ? 64 : 72
  const stroke = 6
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const progress = Math.min(100, Math.max(0, score))
  const strokeDashoffset = circumference - (progress / 100) * circumference

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
      <div className={cn('relative', variant === 'seal' ? 'size-40' : 'size-44')}>
        {variant === 'seal' && (
          <div className="absolute inset-2 rounded-full border-2 border-dashed border-accent/30" />
        )}
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
            className={cn(
              'font-display tabular-nums text-accent',
              variant === 'seal' ? 'text-4xl' : 'text-5xl',
            )}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {displayScore}
          </motion.span>
          <span className="font-mono text-[9px] text-card-foreground/50">
            TRUST / 100
          </span>
        </div>
      </div>
    </div>
  )
}
