import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ReportView } from '@/components/analysis/report/ReportView'
import { Button } from '@/components/ui/button'
import { SAMPLE_REPORT, EXAMPLE_PROMPTS } from '@/lib/sampleReport'
import { ROUTES } from '@/lib/constants'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { AnalysisRecord } from '@veritas/shared'

const ROTATE_MS = 12_000

function buildSampleRecord(example: (typeof EXAMPLE_PROMPTS)[number], index: number): AnalysisRecord {
  return {
    ...SAMPLE_REPORT,
    id: `judge-sample-${index}`,
    title: example.title,
    content: example.content,
    sourceType: example.sourceType,
    trustScore: example.trustScore,
    report: {
      ...SAMPLE_REPORT.report,
      trustScore: example.trustScore,
      summary: `Demo dossier for: ${example.label}. ${SAMPLE_REPORT.report.summary}`,
    },
  }
}

const JUDGE_SAMPLES = EXAMPLE_PROMPTS.map((example, index) => buildSampleRecord(example, index))

export function JudgeModePage() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % JUDGE_SAMPLES.length)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [paused])

  const record = JUDGE_SAMPLES[index]!

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-surface text-card-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-accent/20 px-6 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <Link to={ROUTES.home} aria-label="Exit judge mode">
              <ArrowLeft className="size-4" />
              Exit
            </Link>
          </Button>
          <div>
            <p className="font-mono text-[10px] text-accent-secondary/80">{t('judge.title')}</p>
            <p className="font-display text-lg">{t('judge.sample')} {index + 1} / {JUDGE_SAMPLES.length}</p>
          </div>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Sample cases">
          {JUDGE_SAMPLES.map((sample, i) => (
            <button
              key={sample.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 w-8 transition-colors ${
                i === index ? 'bg-accent-secondary' : 'bg-accent/25 hover:bg-accent/40'
              }`}
              aria-label={`${sample.title ?? 'Sample'} ${i + 1}`}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
        <div className="mx-auto max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={record.id}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={reducedMotion ? false : { opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <ReportView record={record} readOnly />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
