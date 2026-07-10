import { motion } from 'framer-motion'
import { Check, Fingerprint, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInvestigationProgress } from '@/hooks/useInvestigationProgress'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface AnalysisLoadingProps {
  className?: string
}

export function AnalysisLoading({ className }: AnalysisLoadingProps) {
  const { phases, activeStep, completedSteps, statusText, isComplete } =
    useInvestigationProgress()
  const reducedMotion = useReducedMotion()
  const progress = Math.round(
    ((completedSteps.size + (isComplete ? 0 : 0.35)) / phases.length) * 100,
  )

  return (
    <div
      className={cn(
        'intel-panel grain relative overflow-hidden scan-line p-6 md:p-8',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Investigation in progress"
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="meta-label flex items-center gap-2 text-accent">
            <Fingerprint className="size-3" strokeWidth={1.75} />
            Active investigation
          </p>
          <h2 className="mt-2 font-display text-xl text-foreground md:text-2xl">
            Building case dossier
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{statusText}</p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="font-mono text-2xl tabular-nums text-accent">{Math.min(progress, 99)}%</p>
          <p className="meta-label mt-1">Progress</p>
        </div>
      </div>

      <div className="relative z-10 mt-6 h-1 overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={reducedMotion ? false : { width: '0%' }}
          animate={{ width: `${Math.min(progress, 99)}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      <ol className="relative z-10 mt-6 space-y-1.5 border-t border-border pt-5">
        {phases.map((phase, index) => {
          const isPhaseComplete = completedSteps.has(index)
          const isActive = index === activeStep && !isPhaseComplete

          return (
            <motion.li
              key={phase.id}
              className={cn(
                'flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors duration-200',
                isActive && 'border-accent/35 bg-accent/5',
                isPhaseComplete && 'border-border/80 bg-elevated/40',
                !isActive && !isPhaseComplete && 'border-transparent opacity-40',
              )}
              animate={
                isActive && !reducedMotion ? { opacity: [0.85, 1, 0.85] } : undefined
              }
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px]',
                  isPhaseComplete && 'border-success/50 bg-success/15 text-success',
                  isActive && 'border-accent/50 text-accent',
                  !isActive && !isPhaseComplete && 'border-border text-muted-foreground',
                )}
              >
                {isPhaseComplete ? (
                  <Check className="size-3.5" strokeWidth={2} />
                ) : isActive ? (
                  <Search className="size-3" strokeWidth={1.75} />
                ) : (
                  String(index + 1).padStart(2, '0')
                )}
              </span>
              <span
                className={cn(
                  'text-sm',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {phase.label}
              </span>
              {isActive && (
                <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-accent">
                  Live
                </span>
              )}
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
