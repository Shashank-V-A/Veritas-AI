import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
} from '@/lib/onboarding'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const STEPS = [
  {
    title: 'Welcome to Veritas AI',
    description:
      'Verify information before you trust it. We analyze content and produce professional credibility reports — not chat responses.',
  },
  {
    title: 'Paste any content',
    description:
      'Articles, social posts, transcripts, WhatsApp forwards, or raw text. Select the source type for better analysis.',
    highlight: 'analysis-input',
  },
  {
    title: 'Get your report',
    description:
      'Hit Analyze and receive a structured report with trust scores, claims, bias detection, and fallacy identification.',
    highlight: 'analyze-button',
  },
  {
    title: 'Review your history',
    description:
      'Every analysis is saved. Access past reports from the sidebar or press Ctrl+K to search quickly.',
    highlight: 'sidebar-nav',
  },
]

export function OnboardingTour() {
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

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
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleComplete()
    }
  }

  const current = STEPS[step]

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
                  {STEPS.map((_, i) => (
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
                  aria-label="Skip onboarding"
                >
                  <X className="size-4" />
                </button>
              </div>

              <p className="text-xs font-medium uppercase tracking-widest text-accent">
                Step {step + 1} of {STEPS.length}
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
                  Skip tour
                </button>
                <Button size="sm" className="gap-2" onClick={handleNext}>
                  {step < STEPS.length - 1 ? 'Continue' : 'Get started'}
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
