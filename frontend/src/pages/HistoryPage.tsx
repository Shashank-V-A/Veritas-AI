import { motion } from 'framer-motion'
import { FolderOpen } from 'lucide-react'
import { slideUp, staggerContainer } from '@/animations/variants'
import { HistoryList } from '@/components/analysis/HistoryList'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function HistoryPage() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="intel-grid mx-auto max-w-5xl px-4 py-8 md:px-10 md:py-10">
      <motion.div
        variants={reducedMotion ? undefined : staggerContainer}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <motion.header variants={reducedMotion ? undefined : slideUp} className="mb-10">
          <p className="meta-label flex items-center gap-2 text-accent">
            <FolderOpen className="size-3" strokeWidth={1.75} />
            Case file archive
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-foreground md:text-4xl">
            Your credibility dossiers
          </h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
            Every report you&apos;ve run — searchable, private, and tied to your account.
          </p>
        </motion.header>

        <motion.div variants={reducedMotion ? undefined : slideUp}>
          <HistoryList />
        </motion.div>
      </motion.div>
    </div>
  )
}
