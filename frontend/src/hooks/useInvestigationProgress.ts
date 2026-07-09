import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export const INVESTIGATION_PHASES = [
  { id: 'claims', label: 'Extracting claims from source material', durationMs: 3200 },
  { id: 'evidence', label: 'Cross-referencing evidence databases', durationMs: 4800 },
  { id: 'bias', label: 'Measuring bias vectors', durationMs: 3600 },
  { id: 'fallacies', label: 'Scanning for logical fallacies', durationMs: 3000 },
  { id: 'dossier', label: 'Compiling credibility dossier', durationMs: 4000 },
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
