import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const ANALYSIS_STEPS = [
  'Extracting claims from source material',
  'Cross-referencing evidence databases',
  'Measuring bias vectors',
  'Scanning for logical fallacies',
  'Detecting emotional manipulation',
  'Compiling credibility dossier',
]

interface AnalysisLoadingProps {
  className?: string
}

export function AnalysisLoading({ className }: AnalysisLoadingProps) {
  const reducedMotion = useReducedMotion()
  const [activeStep, setActiveStep] = useState(0)
  const [statusText, setStatusText] = useState(ANALYSIS_STEPS[0])

  useEffect(() => {
    if (reducedMotion) return

    const stepTimer = window.setInterval(() => {
      setActiveStep((s) => {
        const next = (s + 1) % ANALYSIS_STEPS.length
        setStatusText(ANALYSIS_STEPS[next])
        return next
      })
    }, 2200)

    return () => window.clearInterval(stepTimer)
  }, [reducedMotion])

  return (
    <div
      className={cn('panel-parchment scan-line overflow-hidden p-8 md:p-10', className)}
      role="status"
      aria-live="polite"
      aria-label="Analysis in progress"
    >
      <div className="mb-8">
        <p className="font-mono text-[10px] text-foreground/50">Investigation in progress</p>
        <p className="mt-2 font-display text-2xl text-foreground md:text-3xl">
          Building credibility dossier
        </p>
        <p className="mt-2 text-sm text-foreground/65">{statusText}…</p>
      </div>

      <div className="space-y-2 border-t border-foreground/10 pt-6">
        {ANALYSIS_STEPS.map((step, index) => {
          const isComplete = index < activeStep
          const isActive = index === activeStep

          return (
            <motion.div
              key={step}
              className={cn(
                'flex items-center gap-3 border px-3 py-2.5 transition-colors',
                isActive && 'border-accent/25 bg-accent/5',
                isComplete && 'border-foreground/10 opacity-60',
                !isActive && !isComplete && 'border-transparent opacity-35',
              )}
              animate={isActive && !reducedMotion ? { x: [0, 2, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center border font-mono text-[9px]',
                  isComplete
                    ? 'border-accent/40 bg-accent text-primary-foreground'
                    : isActive
                      ? 'border-accent/40 text-accent'
                      : 'border-foreground/15 text-foreground/40',
                )}
              >
                {isComplete ? <Check className="size-3" /> : index + 1}
              </span>
              <span className="text-xs text-foreground/80">{step}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
