import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/animations/variants'
import { HistoryList } from '@/components/analysis/HistoryList'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function HistoryPage() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-10 md:py-12">
      <motion.div
        variants={reducedMotion ? undefined : staggerContainer}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <motion.header variants={reducedMotion ? undefined : slideUp} className="mb-10">
          <p className="font-mono text-xs text-accent/70">Case file archive</p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-card-foreground md:text-4xl">
            Your credibility dossiers
          </h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-card-foreground/65">
            Every report you&apos;ve run — searchable, private, and tied to your
            account.
          </p>
        </motion.header>

        <motion.div variants={reducedMotion ? undefined : slideUp}>
          <HistoryList />
        </motion.div>
      </motion.div>
    </div>
  )
}
