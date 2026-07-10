import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

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
    <section id="product" className="border-t border-border px-6 py-14 md:px-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden border border-white/[0.1] bg-[#0d0d0d]"
        >
          <div className="border-b border-white/[0.08] px-5 py-5 md:px-6 md:py-5">
            <p className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
              {t('landing.diffEyebrow')}
            </p>
            <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {t('landing.diffTitle')}
            </h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {t('landing.diffBody')}
            </p>
          </div>

          <div className="grid grid-cols-[5.5rem_1fr_1fr] border-b border-white/[0.06] bg-[#111] px-5 py-2.5 md:grid-cols-[7rem_1fr_1fr] md:px-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
              {t('landing.diffAxis')}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              {t('landing.diffChatbot')}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
              {t('app.name')}
            </span>
          </div>

          <ul>
            {differences.map((item, index) => (
              <li
                key={item.title}
                className={`grid grid-cols-[5.5rem_1fr_1fr] items-baseline gap-x-2 px-5 py-3 md:grid-cols-[7rem_1fr_1fr] md:gap-x-3 md:px-6 md:py-3.5 ${
                  index < differences.length - 1 ? 'border-b border-white/[0.06]' : ''
                }`}
              >
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {item.title}
                </span>
                <span className="text-[13px] leading-snug text-muted-foreground/85">
                  {item.chatbot}
                </span>
                <span className="text-[13px] leading-snug text-foreground/95">{item.veritas}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
