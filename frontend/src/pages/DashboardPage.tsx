import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Fingerprint } from 'lucide-react'
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
    if (query) {
      setPrefill({ content: query, sourceType: 'raw', title: 'Bookmarklet intake' })
      return
    }
    const url = searchParams.get('url')?.trim()
    if (url) {
      setPrefill({ content: '', sourceType: 'article', title: 'Page verification', url })
    }
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
    <div className="intel-grid relative mx-auto max-w-6xl px-4 py-8 md:px-10 md:py-10">
      <motion.div
        variants={reducedMotion ? undefined : staggerContainer}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <motion.header variants={reducedMotion ? undefined : slideUp} className="mb-8">
          <p className="meta-label flex items-center gap-2 text-accent">
            <Fingerprint className="size-3" strokeWidth={1.75} />
            Investigation workspace
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-foreground md:text-4xl">
            Open a new case
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            Submit evidence below. Veritas returns a forensic credibility dossier — claims,
            bias, fallacies, and a trust verdict.
          </p>
          <div className="accent-line mt-6 w-28" />
          <MissionControl total={total} items={items} />
        </motion.header>

        <motion.section variants={reducedMotion ? undefined : slideUp} className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="meta-label">Reference dossiers</p>
              <h2 className="mt-1 font-display text-lg text-foreground">
                Load a sample case file
              </h2>
            </div>
            {total === 0 && (
              <p className="hidden font-mono text-[10px] text-muted-foreground sm:block">
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
            className="mt-12"
          >
            <div className="case-rule mb-5" />
            <p className="meta-label">Archive</p>
            <h2 className="mt-1 font-display text-xl text-foreground">Recent case files</h2>
            <div className="mt-5">
              <RecentAnalyses limit={5} />
            </div>
          </motion.section>
        )}
      </motion.div>
    </div>
  )
}
