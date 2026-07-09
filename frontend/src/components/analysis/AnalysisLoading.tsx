import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInvestigationProgress } from '@/hooks/useInvestigationProgress'

interface AnalysisLoadingProps {
  className?: string
}

export function AnalysisLoading({ className }: AnalysisLoadingProps) {
  const { phases, activeStep, completedSteps, statusText } = useInvestigationProgress()

  return (
    <div
      className={cn('case-intake-panel grain relative overflow-hidden p-8 md:p-10', className)}
      role="status"
      aria-live="polite"
      aria-label="Analysis in progress"
    >
      <div className="relative z-10 mb-8">
        <p className="font-mono text-[10px] text-card-foreground/50">Investigation in progress</p>
        <p className="mt-2 font-display text-2xl text-card-foreground md:text-3xl">
          Building credibility dossier
        </p>
        <p className="mt-2 text-sm text-card-foreground/65">{statusText}…</p>
      </div>

      <div className="relative z-10 space-y-2 border-t border-accent/15 pt-6">
        {phases.map((phase, index) => {
          const isComplete = completedSteps.has(index)
          const isActive = index === activeStep && !isComplete

          return (
            <motion.div
              key={phase.id}
              className={cn(
                'flex items-center gap-3 border px-3 py-2.5 transition-colors',
                isActive && 'border-accent/25 bg-accent/5',
                isComplete && 'border-accent/15 opacity-80',
                !isActive && !isComplete && 'border-transparent opacity-35',
              )}
              animate={isActive ? { x: [0, 2, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center border font-mono text-[9px]',
                  isComplete
                    ? 'border-accent/40 bg-accent text-primary-foreground'
                    : isActive
                      ? 'border-accent-secondary/50 text-accent-secondary'
                      : 'border-card-foreground/15 text-card-foreground/40',
                )}
              >
                {isComplete ? <Check className="size-3" /> : index + 1}
              </span>
              <span className="text-xs text-card-foreground/80">{phase.label}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
