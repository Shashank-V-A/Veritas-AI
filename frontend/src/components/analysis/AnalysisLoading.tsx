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
      className={cn('rounded-xl border border-border bg-surface p-6', className)}
      role="status"
      aria-live="polite"
      aria-label="Analysis in progress"
    >
      <div className="mb-6 flex items-center gap-4">
        <div className="relative size-14 shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 animate-pulse rounded-full border-2 border-accent/40 border-t-accent" />
          <div className="absolute inset-2 rounded-full bg-accent/5" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground">
            Analyzing content…
          </p>
          <p className="text-xs text-muted-foreground">
            This may take up to a minute
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {ANALYSIS_STEPS.map((step, index) => (
          <motion.div
            key={step}
            className="flex items-center gap-3"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.3,
            }}
          >
            <div className="size-1.5 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">{step}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <Skeleton className="h-3 w-full shimmer" />
        <Skeleton className="h-3 w-4/5 shimmer" />
        <Skeleton className="h-3 w-3/5 shimmer" />
      </div>
    </div>
  )
}
