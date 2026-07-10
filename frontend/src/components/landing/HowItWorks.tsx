import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight, FileText, Fingerprint, FolderOpen, Network } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function HowItWorks() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()

  const steps = [
    {
      n: '01',
      icon: FolderOpen,
      title: t('landing.stepSubmit'),
      description: t('landing.stepSubmitDesc'),
    },
    {
      n: '02',
      icon: Fingerprint,
      title: t('landing.stepInvestigate'),
      description: t('landing.stepInvestigateDesc'),
    },
    {
      n: '03',
      icon: Network,
      title: t('landing.stepAnalyze'),
      description: t('landing.stepAnalyzeDesc'),
    },
    {
      n: '04',
      icon: FileText,
      title: t('landing.stepReport'),
      description: t('landing.stepReportDesc'),
    },
  ] as const

  return (
    <section id="how-it-works" className="px-6 py-20 md:px-12 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
          {t('nav.howItWorks')}
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-foreground md:text-5xl">
          {t('landing.howTitle')}
        </h2>

        <div className="relative mt-14 grid gap-8 md:grid-cols-4 md:gap-4">
          {/* Connector line */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px border-t border-dashed border-accent/30 md:block"
            aria-hidden
          />

          {steps.map((step, index) => (
            <motion.div
              key={step.n}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className="relative"
            >
              <div className="relative z-10 flex size-16 items-center justify-center border border-accent/40 bg-[#0a0a0a]">
                <step.icon className="size-6 text-accent" strokeWidth={1.25} />
              </div>
              <p className="mt-5 font-mono text-[10px] text-accent/70">{step.n}</p>
              <h3 className="mt-1 font-display text-2xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              {index < steps.length - 1 && (
                <ArrowRight
                  className="absolute -right-2 top-5 hidden size-4 text-accent/40 md:block lg:-right-1"
                  strokeWidth={1.25}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
