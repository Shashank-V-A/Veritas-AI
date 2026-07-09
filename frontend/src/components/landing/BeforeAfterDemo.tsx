import { motion } from 'framer-motion'
import { getVerdictLabel } from '@/lib/format'
import { SAMPLE_ORIGINAL_SNIPPET, SAMPLE_REPORT } from '@/lib/sampleReport'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function BeforeAfterDemo() {
  const reducedMotion = useReducedMotion()
  const { report } = SAMPLE_REPORT

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="border border-foreground/15 bg-foreground/5 p-5"
      >
        <p className="font-mono text-[10px] text-foreground/50">Source material</p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/85 italic">
          &ldquo;{SAMPLE_ORIGINAL_SNIPPET}&rdquo;
        </p>
      </motion.div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, x: 16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="border border-accent/25 bg-surface p-5 text-card-foreground"
      >
        <p className="font-mono text-[10px] text-accent/70">Veritas verdict</p>
        <p className="mt-2 font-display text-2xl text-accent">
          {getVerdictLabel(report.verdict)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-card-foreground/75">
          {report.summary.slice(0, 140)}…
        </p>
        <p className="mt-3 font-mono text-xs text-accent">
          Trust score: {report.trustScore}/100
        </p>
      </motion.div>
    </div>
  )
}
