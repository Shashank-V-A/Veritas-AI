import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Network } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ReportView } from '@/components/analysis/report/ReportView'
import { Button } from '@/components/ui/button'
import { SAMPLE_REPORT, EXAMPLE_PROMPTS } from '@/lib/sampleReport'
import { ROUTES } from '@/lib/constants'
import { HazardTapeCross } from '@/components/brand/HazardTape'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { api } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import type { AnalysisRecord } from '@veritas/shared'
import type { NarrativeCluster } from '@/services/api'

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
  const { user } = useAuth()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [mode, setMode] = useState<'samples' | 'narratives'>('samples')
  const [clusterIndex, setClusterIndex] = useState(0)
  const [caseIndex, setCaseIndex] = useState(0)
  const [liveRecord, setLiveRecord] = useState<AnalysisRecord | null>(null)

  const { data: narratives } = useQuery({
    queryKey: ['narratives'],
    queryFn: () => api.getNarratives(8),
    enabled: Boolean(user),
    retry: false,
  })

  const clusters = narratives?.clusters ?? []
  const activeCluster: NarrativeCluster | undefined = clusters[clusterIndex]

  useEffect(() => {
    if (paused || mode !== 'samples') return
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % JUDGE_SAMPLES.length)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [paused, mode])

  useEffect(() => {
    if (mode !== 'narratives' || !activeCluster?.cases[caseIndex]) {
      setLiveRecord(null)
      return
    }
    const caseId = activeCluster.cases[caseIndex]!.id
    let cancelled = false
    void api.getReport(caseId).then((record) => {
      if (!cancelled) setLiveRecord(record)
    }).catch(() => {
      if (!cancelled) setLiveRecord(null)
    })
    return () => {
      cancelled = true
    }
  }, [mode, activeCluster, caseIndex])

  const sampleRecord = JUDGE_SAMPLES[index]!
  const record = mode === 'narratives' && liveRecord ? liveRecord : sampleRecord

  return (
    <div
      className="relative flex min-h-svh flex-col overflow-hidden bg-surface text-card-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <HazardTapeCross density="corners" className="opacity-50" />
      <header className="relative z-10 flex shrink-0 flex-col gap-3 border-b border-accent/20 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to={ROUTES.home} aria-label="Exit judge mode">
                <ArrowLeft className="size-4" />
                Exit
              </Link>
            </Button>
            <div>
              <p className="font-mono text-[10px] text-accent-secondary/80">{t('judge.title')}</p>
              <p className="font-display text-lg">
                {mode === 'samples'
                  ? `${t('judge.sample')} ${index + 1} / ${JUDGE_SAMPLES.length}`
                  : t('judge.narrativeMode')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === 'samples' ? 'default' : 'ghost'}
              onClick={() => setMode('samples')}
            >
              {t('judge.samplesTab')}
            </Button>
            <Button
              size="sm"
              variant={mode === 'narratives' ? 'default' : 'ghost'}
              onClick={() => setMode('narratives')}
              disabled={!user || clusters.length === 0}
              className="gap-1.5"
            >
              <Network className="size-3.5" />
              {t('judge.narrativesTab')}
            </Button>
          </div>
        </div>

        {mode === 'samples' ? (
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
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {clusters.map((cluster, i) => (
              <button
                key={cluster.id}
                type="button"
                onClick={() => {
                  setClusterIndex(i)
                  setCaseIndex(0)
                }}
                className={
                  i === clusterIndex
                    ? 'border border-accent bg-accent/10 px-2 py-1 font-mono text-[10px] text-accent'
                    : 'border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground'
                }
              >
                {cluster.title} ({cluster.cases.length})
              </button>
            ))}
            {activeCluster && (
              <div className="flex w-full flex-wrap gap-2">
                {activeCluster.cases.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCaseIndex(i)}
                    className={
                      i === caseIndex
                        ? 'border border-accent-secondary px-2 py-1 text-xs text-foreground'
                        : 'border border-border px-2 py-1 text-xs text-muted-foreground'
                    }
                  >
                    {c.title || c.id.slice(0, 8)} · {c.trustScore}
                  </button>
                ))}
                {activeCluster.sharedClaims.length > 0 && (
                  <p className="w-full text-xs text-muted-foreground">
                    {t('judge.sharedClaims')}: {activeCluster.sharedClaims.join(' · ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8 md:px-12">
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
