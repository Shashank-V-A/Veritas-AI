import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const ANALYSIS_STEPS = [
  'Extracting claims',
  'Evaluating evidence',
  'Detecting bias',
  'Scanning for fallacies',
  'Assessing emotional manipulation',
  'Generating report',
]

interface AnalysisLoadingProps {
  className?: string
}

export function AnalysisLoading({ className }: AnalysisLoadingProps) {
  return (
    <div
      className={cn('panel-gold p-8 md:p-10', className)}
      role="status"
      aria-live="polite"
      aria-label="Analysis in progress"
    >
      <div className="mb-8 flex items-center gap-5">
        <div className="relative size-16 shrink-0">
          <motion.div
            className="absolute inset-0 border border-black/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-2 border-t border-foreground"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <div className="flex-1">
          <p className="text-xl font-semibold text-foreground md:text-2xl">
            Forensic analysis in progress
          </p>
          <p className="mt-1 text-sm text-foreground/65">
            Building your credibility dossier — typically under a minute
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/50 pt-6">
        {ANALYSIS_STEPS.map((step, index) => (
          <motion.div
            key={step}
            className="flex items-center gap-3"
            initial={{ opacity: 0.3, x: -8 }}
            animate={{ opacity: [0.35, 1, 0.35], x: 0 }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              delay: index * 0.35,
            }}
          >
            <span className="size-1 shrink-0 bg-accent" />
            <span className="text-xs tracking-wide text-muted-foreground">
              {step}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 space-y-2">
        <Skeleton className="h-2.5 w-full shimmer" />
        <Skeleton className="h-2.5 w-4/5 shimmer" />
        <Skeleton className="h-2.5 w-3/5 shimmer" />
      </div>
    </div>
  )
}
