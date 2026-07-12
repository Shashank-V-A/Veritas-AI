import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Fingerprint } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { staggerContainer, slideUp } from '@/animations/variants'
import { AnalysisInput } from '@/components/analysis/AnalysisInput'
import { BatchIntake } from '@/components/dashboard/BatchIntake'
import { CaseSampleCard } from '@/components/dashboard/CaseSampleCard'
import { MissionControl } from '@/components/dashboard/MissionControl'
import { EXAMPLE_PROMPTS } from '@/lib/sampleReport'
import type { AnalysisPrefill } from '@/lib/sampleReport'
import { useHistory } from '@/hooks/useHistory'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const SAMPLE_I18N = [
  { labelKey: 'dashboard.sampleHealth', categoryKey: 'dashboard.categoryHealth', riskKey: 'dashboard.riskHigh' },
  { labelKey: 'dashboard.samplePolitical', categoryKey: 'dashboard.categoryPolitical', riskKey: 'dashboard.riskHigh' },
  { labelKey: 'dashboard.sampleNews', categoryKey: 'dashboard.categoryNews', riskKey: 'dashboard.riskCredible' },
] as const

export function DashboardPage() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const [searchParams] = useSearchParams()
  const { data } = useHistory({ limit: 100 })
  const total = data?.total ?? 0
  const items = data?.items ?? []
  const [prefill, setPrefill] = useState<AnalysisPrefill | null>(null)
  const [activeSample, setActiveSample] = useState<string | null>(null)

  useEffect(() => {
    const text =
      searchParams.get('text')?.trim() ||
      searchParams.get('content')?.trim() ||
      searchParams.get('q')?.trim()
    const url = searchParams.get('url')?.trim()
    const source = searchParams.get('source')?.toLowerCase()
    const autoRun =
      searchParams.get('autorun') === '1' || searchParams.get('autorun') === 'true'
    const isForward =
      source === 'whatsapp' || source === 'telegram' || source === 'forward'

    if (text) {
      setPrefill({
        content: text,
        sourceType: isForward ? 'forward' : 'raw',
        title: isForward
          ? source === 'telegram'
            ? 'Telegram forward'
            : 'WhatsApp forward'
          : 'Bookmarklet intake',
        autoRun,
      })
      return
    }
    if (url) {
      setPrefill({
        content: '',
        sourceType: 'article',
        title: 'Page verification',
        url,
        autoRun,
      })
    }
  }, [searchParams])

  function handleSampleSelect(example: (typeof EXAMPLE_PROMPTS)[number]) {
    setActiveSample(example.label)
    setPrefill({
      content: example.content,
      sourceType: example.sourceType,
      title: example.title,
      category: example.category,
      sampleId: example.sampleId,
      autoRun: true,
    })
    window.requestAnimationFrame(() => {
      document.getElementById('analysis-intake')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
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
            {t('dashboard.eyebrow')}
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-foreground md:text-4xl">
            {t('dashboard.title')}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t('dashboard.body')}
          </p>
          <div className="accent-line mt-6 w-28" />
          <MissionControl total={total} items={items} />
        </motion.header>

        <motion.section variants={reducedMotion ? undefined : slideUp} className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                {t('dashboard.referenceEyebrow')}
              </p>
              <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {t('dashboard.referenceTitle')}
              </h2>
            </div>
            {total === 0 && (
              <p className="hidden font-sans text-[12px] text-muted-foreground sm:block">
                {t('dashboard.pasteOwn')}
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLE_PROMPTS.map((example, index) => {
              const i18n = SAMPLE_I18N[index]
              return (
                <CaseSampleCard
                  key={example.label}
                  category={t(i18n.categoryKey)}
                  label={t(i18n.labelKey)}
                  trustScore={example.trustScore}
                  riskLabel={t(i18n.riskKey)}
                  prefill={{
                    content: example.content,
                    sourceType: example.sourceType,
                    title: example.title,
                    category: example.category,
                    sampleId: example.sampleId,
                  }}
                  isActive={activeSample === example.label}
                  onSelect={() => handleSampleSelect(example)}
                />
              )
            })}
          </div>
        </motion.section>

        <motion.div variants={reducedMotion ? undefined : slideUp} className="mb-8">
          <BatchIntake className="mb-8" />
          <AnalysisInput
            prefill={prefill}
            onPrefillConsumed={() => setPrefill(null)}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
