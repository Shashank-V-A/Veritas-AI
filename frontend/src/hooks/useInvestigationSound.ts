import { useEffect, useRef, useState } from 'react'
import { investigationAudio } from '@/lib/investigationAudio'

/** Plays the investigation soundscape while `active` is true. */
export function useInvestigationSound(active: boolean, phaseIndex = 0) {
  const [enabled, setEnabled] = useState(() => investigationAudio.isEnabled())
  const wasActive = useRef(false)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => investigationAudio.subscribe(setEnabled), [])

  useEffect(() => {
    if (wasActive.current && !active && enabledRef.current) {
      investigationAudio.resolve()
    }
    wasActive.current = active
  }, [active])

  useEffect(() => {
    return () => {
      // AnalysisLoading stays active until unmount — chime on leave
      if (wasActive.current && enabledRef.current) {
        investigationAudio.resolve()
      }
      investigationAudio.stop()
    }
  }, [])

  useEffect(() => {
    if (!active || !enabled) {
      investigationAudio.stop()
      return
    }

    investigationAudio.start()
    return () => {
      investigationAudio.stop()
    }
  }, [active, enabled])

  useEffect(() => {
    if (!active || !enabled || phaseIndex <= 0) return
    investigationAudio.ping()
  }, [active, enabled, phaseIndex])

  return {
    enabled,
    setEnabled: (value: boolean) => investigationAudio.setEnabled(value),
    unlock: () => investigationAudio.unlock(),
  }
}
