import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export const INVESTIGATION_PHASES = [
  { id: 'init', label: 'Initializing investigation', durationMs: 1800 },
  { id: 'claims', label: 'Scanning claims', durationMs: 3200 },
  { id: 'evidence', label: 'Extracting evidence', durationMs: 4000 },
  { id: 'sources', label: 'Cross-referencing sources', durationMs: 4200 },
  { id: 'bias', label: 'Evaluating bias', durationMs: 3000 },
  { id: 'fallacies', label: 'Checking logical fallacies', durationMs: 2800 },
  { id: 'dossier', label: 'Preparing report', durationMs: 3200 },
] as const

export function useInvestigationProgress(active = true) {
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

    let stepIndex = 0
    let timeoutId: number

    function advance() {
      if (stepIndex >= INVESTIGATION_PHASES.length) return

      setActiveStep(stepIndex)

      timeoutId = window.setTimeout(() => {
        setCompletedSteps((prev) => new Set([...prev, stepIndex]))
        stepIndex += 1
        if (stepIndex < INVESTIGATION_PHASES.length) {
          advance()
        }
      }, INVESTIGATION_PHASES[stepIndex].durationMs)
    }

    advance()

    return () => window.clearTimeout(timeoutId)
  }, [active, reducedMotion])

  const statusText = INVESTIGATION_PHASES[activeStep]?.label ?? INVESTIGATION_PHASES[0].label

  return {
    phases: INVESTIGATION_PHASES,
    activeStep,
    completedSteps,
    statusText,
    isComplete: completedSteps.size >= INVESTIGATION_PHASES.length,
  }
}
