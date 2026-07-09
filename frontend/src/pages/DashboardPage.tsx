import { useState } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer, slideUp } from '@/animations/variants'
import { AnalysisInput } from '@/components/analysis/AnalysisInput'
import { RecentAnalyses } from '@/components/analysis/RecentAnalyses'
import { EXAMPLE_PROMPTS, type AnalysisPrefill } from '@/lib/sampleReport'
import { useHistory } from '@/hooks/useHistory'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function DashboardPage() {
  const reducedMotion = useReducedMotion()
  const { data } = useHistory({ limit: 100 })
  const total = data?.total ?? 0
  const [prefill, setPrefill] = useState<AnalysisPrefill | null>(null)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-10 md:py-12">
      <motion.div
        variants={reducedMotion ? undefined : staggerContainer}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <motion.header variants={reducedMotion ? undefined : slideUp} className="mb-10">
          <p className="font-mono text-xs text-accent/70">Investigation workspace</p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-card-foreground md:text-4xl">
            Submit evidence for analysis
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-card-foreground/65">
            Drop content below. Veritas returns a forensic credibility dossier — not opinions,
            not chat, only evidence.
          </p>

          <div className="mt-8 flex gap-10 border-t border-accent/20 pt-6">
            <div>
              <p className="font-display text-3xl text-accent">{total}</p>
              <p className="font-mono text-[10px] text-card-foreground/50">Case files opened</p>
            </div>
            <div>
              <p className="font-display text-3xl text-card-foreground">⌘K</p>
              <p className="font-mono text-[10px] text-card-foreground/50">Quick search</p>
            </div>
          </div>
        </motion.header>

        <motion.div variants={reducedMotion ? undefined : slideUp} className="mb-4">
          <p className="mb-2 font-mono text-[10px] text-card-foreground/45">Try a sample</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() =>
                  setPrefill({
                    content: example.content,
                    sourceType: example.sourceType,
                    title: example.title,
                  })
                }
                className="border border-accent/25 bg-accent/5 px-3 py-1.5 text-xs text-card-foreground transition-colors hover:border-accent/45 hover:bg-accent/10"
              >
                {example.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={reducedMotion ? undefined : slideUp}>
          <AnalysisInput prefill={prefill} onPrefillConsumed={() => setPrefill(null)} />
        </motion.div>

        <motion.section
          variants={reducedMotion ? undefined : slideUp}
          className="mt-14"
        >
          <div className="mb-5 border-b border-accent/15 pb-3">
            <p className="font-mono text-[10px] text-card-foreground/50">Recent investigations</p>
            <h2 className="mt-1 font-display text-xl text-card-foreground">Case files</h2>
          </div>
          <RecentAnalyses limit={5} />
        </motion.section>
      </motion.div>
    </div>
  )
}
