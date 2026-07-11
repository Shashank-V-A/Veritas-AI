import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export const INVESTIGATION_PHASES = [
  { id: 'init', labelKey: 'loading.init', durationMs: 1800 },
  { id: 'claims', labelKey: 'loading.claims', durationMs: 3200 },
  { id: 'evidence', labelKey: 'loading.evidence', durationMs: 4000 },
  { id: 'sources', labelKey: 'loading.sources', durationMs: 4200 },
  { id: 'bias', labelKey: 'loading.bias', durationMs: 3000 },
  { id: 'fallacies', labelKey: 'loading.fallacies', durationMs: 2800 },
  { id: 'dossier', labelKey: 'loading.dossier', durationMs: 3200 },
] as const

export function useInvestigationProgress(active = true) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!active) return

    if (reducedMotion) {
      setActiveStep(INVESTIGATION_PHASES.length - 1)
      setCompletedSteps(new Set(INVESTIGATION_PHASES.map((_, i) => i)))
      return
    }

    setActiveStep(0)
    setCompletedSteps(new Set())

    const timeouts: number[] = []
    let cancelled = false
    let stepIndex = 0

    function advance() {
      if (cancelled || stepIndex >= INVESTIGATION_PHASES.length) return

      // Capture index for this phase so the timeout never marks the wrong step
      const current = stepIndex
      setActiveStep(current)

      const timeoutId = window.setTimeout(() => {
        if (cancelled) return

        setCompletedSteps((prev) => {
          const next = new Set(prev)
          next.add(current)
          return next
        })

        stepIndex = current + 1
        if (stepIndex < INVESTIGATION_PHASES.length) {
          advance()
        }
      }, INVESTIGATION_PHASES[current].durationMs)

      timeouts.push(timeoutId)
    }

    advance()

    return () => {
      cancelled = true
      for (const id of timeouts) window.clearTimeout(id)
    }
  }, [active, reducedMotion])

  const phases = INVESTIGATION_PHASES.map((phase) => ({
    id: phase.id,
    label: t(phase.labelKey),
  }))

  const statusText =
    phases[activeStep]?.label ?? phases[0]?.label ?? t('loading.init')

  return {
    phases,
    activeStep,
    completedSteps,
    statusText,
    isComplete: completedSteps.size >= INVESTIGATION_PHASES.length,
  }
}
