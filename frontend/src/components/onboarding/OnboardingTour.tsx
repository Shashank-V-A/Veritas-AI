import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
} from '@/lib/onboarding'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function OnboardingTour() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  const steps = useMemo(
    () => [
      {
        title: t('onboarding.welcomeTitle'),
        description: t('onboarding.welcomeBody'),
      },
      {
        title: t('onboarding.intakeTitle'),
        description: t('onboarding.intakeBody'),
        highlight: 'analysis-input',
      },
      {
        title: t('onboarding.submitTitle'),
        description: t('onboarding.submitBody'),
        highlight: 'analyze-button',
      },
      {
        title: t('onboarding.archiveTitle'),
        description: t('onboarding.archiveBody'),
        highlight: 'sidebar-nav',
      },
    ],
    [t],
  )

  useEffect(() => {
    if (!hasCompletedOnboarding()) {
      const timer = window.setTimeout(() => setVisible(true), 600)
      return () => window.clearTimeout(timer)
    }
  }, [])

  function handleComplete() {
    markOnboardingComplete()
    setVisible(false)
  }

  function handleNext() {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleComplete()
    }
  }

  const current = steps[step]

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleComplete}
            aria-hidden="true"
          />

          <motion.div
            className="fixed bottom-6 left-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            role="dialog"
            aria-labelledby="onboarding-title"
            aria-describedby="onboarding-desc"
          >
            <div className="rounded-xl border border-border bg-surface p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-6 rounded-full transition-colors ${
                        i <= step ? 'bg-accent' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={t('onboarding.skipAria')}
                >
                  <X className="size-4" />
                </button>
              </div>

              <p className="text-xs font-medium uppercase tracking-widest text-accent">
                {t('onboarding.stepOf', { current: step + 1, total: steps.length })}
              </p>
              <h2
                id="onboarding-title"
                className="mt-2 text-lg font-semibold tracking-tight text-foreground"
              >
                {current.title}
              </h2>
              <p
                id="onboarding-desc"
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
              >
                {current.description}
              </p>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleComplete}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('common.skip')}
                </button>
                <Button size="sm" className="gap-2" onClick={handleNext}>
                  {step < steps.length - 1 ? t('common.continue') : t('common.getStarted')}
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
