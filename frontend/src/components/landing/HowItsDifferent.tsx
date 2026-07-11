import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

const COLS =
  'grid grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,1fr)] md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)]'

export function HowItsDifferent() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()

  const differences = [
    {
      title: t('landing.diffPurpose'),
      chatbot: t('landing.diffPurposeChat'),
      veritas: t('landing.diffPurposeVeritas'),
    },
    {
      title: t('landing.diffEvidence'),
      chatbot: t('landing.diffEvidenceChat'),
      veritas: t('landing.diffEvidenceVeritas'),
    },
    {
      title: t('landing.diffAnalysis'),
      chatbot: t('landing.diffAnalysisChat'),
      veritas: t('landing.diffAnalysisVeritas'),
    },
    {
      title: t('landing.diffOutput'),
      chatbot: t('landing.diffOutputChat'),
      veritas: t('landing.diffOutputVeritas'),
    },
    {
      title: t('landing.diffWorkflow'),
      chatbot: t('landing.diffWorkflowChat'),
      veritas: t('landing.diffWorkflowVeritas'),
    },
  ] as const

  return (
    <section id="product" className="border-t border-border py-14 md:py-16">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35 }}
      >
        <header className="border-b border-white/[0.08] px-6 pb-8 md:px-12 md:pb-10 lg:px-16">
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
            {t('landing.diffEyebrow')}
          </p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
            <h2 className="max-w-2xl font-display text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
              {t('landing.diffTitle')}
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:pb-1 md:text-right">
              {t('landing.diffBody')}
            </p>
          </div>
        </header>

        {/* Column headers — same track template as every row */}
        <div
          className={cn(COLS, 'border-b border-white/[0.08] bg-[#111]')}
          role="row"
        >
          <div className="flex items-center px-6 py-3 md:px-12 lg:px-16">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
              {t('landing.diffAxis')}
            </span>
          </div>
          <div className="flex items-center border-l border-white/[0.08] px-5 py-3 md:px-8">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              {t('landing.diffChatbot')}
            </span>
          </div>
          <div className="flex items-center border-l border-accent/30 bg-accent/[0.06] px-5 py-3 md:px-8">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
              {t('app.name')}
            </span>
          </div>
        </div>

        <ul>
          {differences.map((item, index) => (
            <li
              key={item.title}
              className={cn(
                COLS,
                'items-stretch',
                index < differences.length - 1 && 'border-b border-white/[0.06]',
              )}
            >
              <div className="flex items-center px-6 py-4 md:px-12 md:py-5 lg:px-16">
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {item.title}
                </span>
              </div>
              <div className="flex items-center border-l border-white/[0.06] px-5 py-4 md:px-8 md:py-5">
                <p className="text-[13px] leading-snug text-muted-foreground/85 md:text-sm">
                  {item.chatbot}
                </p>
              </div>
              <div className="flex items-center border-l border-accent/25 bg-accent/[0.04] px-5 py-4 md:px-8 md:py-5">
                <p className="text-[13px] leading-snug text-foreground md:text-sm">
                  {item.veritas}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  )
}
