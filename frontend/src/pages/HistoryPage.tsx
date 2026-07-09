import { motion } from 'framer-motion'
import { slideUp } from '@/animations/variants'
import { HistoryList } from '@/components/analysis/HistoryList'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function HistoryPage() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <motion.div
        variants={reducedMotion ? undefined : slideUp}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          History
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Browse your past credibility analyses.
        </p>

        <HistoryList />
      </motion.div>
    </div>
  )
}
