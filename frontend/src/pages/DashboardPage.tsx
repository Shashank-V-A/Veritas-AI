import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { staggerContainer, slideUp } from '@/animations/variants'
import { AnalysisInput } from '@/components/analysis/AnalysisInput'
import { RecentAnalyses } from '@/components/analysis/RecentAnalyses'
import { BatchIntake } from '@/components/dashboard/BatchIntake'
import { CaseSampleCard } from '@/components/dashboard/CaseSampleCard'
import { MissionControl } from '@/components/dashboard/MissionControl'
import { EXAMPLE_PROMPTS } from '@/lib/sampleReport'
import type { AnalysisPrefill } from '@/lib/sampleReport'
import { useHistory } from '@/hooks/useHistory'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function DashboardPage() {
  const reducedMotion = useReducedMotion()
  const [searchParams] = useSearchParams()
  const { data } = useHistory({ limit: 100 })
  const total = data?.total ?? 0
  const items = data?.items ?? []
  const [prefill, setPrefill] = useState<AnalysisPrefill | null>(null)
  const [activeSample, setActiveSample] = useState<string | null>(null)

  useEffect(() => {
    const query = searchParams.get('q')?.trim()
    if (!query) return
    setPrefill({ content: query, sourceType: 'raw', title: 'Bookmarklet intake' })
  }, [searchParams])

  function handleSampleSelect(example: (typeof EXAMPLE_PROMPTS)[number]) {
    const next: AnalysisPrefill = {
      content: example.content,
      sourceType: example.sourceType,
      title: example.title,
    }
    setActiveSample(example.label)
    setPrefill(next)
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-10 md:py-12">
      <motion.div
        variants={reducedMotion ? undefined : staggerContainer}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <motion.header variants={reducedMotion ? undefined : slideUp} className="mb-8">
          <p className="font-mono text-xs text-accent-secondary/80">Investigation workspace</p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-card-foreground md:text-4xl">
            Submit evidence for analysis
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-card-foreground/65">
            File content below. Veritas returns a forensic credibility dossier — not opinions,
            not chat, only evidence.
          </p>
          <div className="accent-line-on-dark mt-6 w-28" />
          <MissionControl total={total} items={items} />
        </motion.header>

        <motion.section variants={reducedMotion ? undefined : slideUp} className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] text-card-foreground/45">Sample case files</p>
              <h2 className="mt-1 font-display text-lg text-card-foreground">
                Open a reference dossier
              </h2>
            </div>
            {total === 0 && (
              <p className="hidden font-mono text-[10px] text-card-foreground/40 sm:block">
                Or paste your own evidence below
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLE_PROMPTS.map((example) => (
              <CaseSampleCard
                key={example.label}
                category={example.category}
                label={example.label}
                trustScore={example.trustScore}
                riskLabel={example.riskLabel}
                prefill={{
                  content: example.content,
                  sourceType: example.sourceType,
                  title: example.title,
                }}
                isActive={activeSample === example.label}
                onSelect={() => handleSampleSelect(example)}
              />
            ))}
          </div>
        </motion.section>

        <motion.div variants={reducedMotion ? undefined : slideUp} className="mb-8">
          <BatchIntake className="mb-8" />
          <AnalysisInput
            prefill={prefill}
            onPrefillConsumed={() => setPrefill(null)}
          />
        </motion.div>

        {total > 0 && (
          <motion.section
            variants={reducedMotion ? undefined : slideUp}
            className="mt-14"
          >
            <div className="case-rule mb-5" />
            <p className="font-mono text-[10px] text-card-foreground/50">Recent investigations</p>
            <h2 className="mt-1 font-display text-xl text-card-foreground">Case files</h2>
            <div className="mt-5">
              <RecentAnalyses limit={5} />
            </div>
          </motion.section>
        )}
      </motion.div>
    </div>
  )
}
