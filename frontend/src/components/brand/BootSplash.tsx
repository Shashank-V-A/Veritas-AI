import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Volume2 } from 'lucide-react'
import { VeritasMark } from '@/components/brand/VeritasMark'
import { HazardTapeRail } from '@/components/brand/HazardTape'
import { APP_NAME } from '@/lib/constants'
import { playBootVoice } from '@/lib/bootVoice'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const STATUS_KEYS = [
  'boot.statusSecure',
  'boot.statusMesh',
  'boot.statusArchive',
  'boot.statusOpen',
] as const

interface BootSplashProps {
  progress: number
  statusIndex: number
  needsGesture: boolean
  onUnlockSound: () => void
}

function BootSplash({
  progress,
  statusIndex,
  needsGesture,
  onUnlockSound,
}: BootSplashProps) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const statusKey = STATUS_KEYS[Math.min(statusIndex, STATUS_KEYS.length - 1)]!

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex cursor-pointer flex-col bg-[#090909] text-[#F5F5F5]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.12 : 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t('boot.aria')}
      onPointerDown={onUnlockSound}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onUnlockSound()
      }}
      tabIndex={0}
    >
      <HazardTapeRail side="top" className="shrink-0" />

      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 70% 45% at 50% 35%, rgba(200,162,74,0.08), transparent 70%),
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, 40px 40px, 40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <motion.div
          className="flex size-16 items-center justify-center border border-accent/40 bg-accent/10 md:size-20"
          animate={
            reducedMotion
              ? undefined
              : {
                  boxShadow: [
                    '0 0 0 0 rgba(200,162,74,0)',
                    '0 0 0 10px rgba(200,162,74,0.08)',
                    '0 0 0 0 rgba(200,162,74,0)',
                  ],
                }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="size-12 md:size-14">
            <VeritasMark variant="on-dark" bare />
          </div>
        </motion.div>

        <p className="mt-8 font-sans text-[10px] font-medium uppercase tracking-[0.28em] text-accent">
          {t('boot.eyebrow')}
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {APP_NAME.toUpperCase()}
        </h1>
        <p className="mt-2 max-w-sm text-center font-display text-sm italic text-accent/90 md:text-base">
          {t('boot.tagline')}
        </p>

        <div className="mt-10 w-full max-w-xs">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {t(statusKey)}
            </p>
            <p className="font-mono text-[10px] tabular-nums text-accent">
              {Math.min(100, Math.round(progress))}%
            </p>
          </div>
          <div className="h-0.5 overflow-hidden bg-border">
            <motion.div
              className="h-full bg-accent"
              initial={false}
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          </div>
        </div>

        {needsGesture && (
          <motion.p
            className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-accent"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            <Volume2 className="size-3.5" strokeWidth={1.75} />
            {t('boot.tapForSound')}
          </motion.p>
        )}

        <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {t('boot.classified')}
        </p>
      </div>

      <HazardTapeRail side="bottom" className="shrink-0" />
    </motion.div>
  )
}

interface BootGateProps {
  children: React.ReactNode
  /** Minimum time the splash stays visible (ms). */
  minDurationMs?: number
}

/**
 * Branded splash on full page load, then fades into the app.
 */
export function BootGate({ children, minDurationMs = 3200 }: BootGateProps) {
  const reducedMotion = useReducedMotion()
  const [progress, setProgress] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)
  const [showSplash, setShowSplash] = useState(true)
  const [needsGesture, setNeedsGesture] = useState(false)
  const voiceRef = useRef<ReturnType<typeof playBootVoice> | null>(null)

  useEffect(() => {
    const voice = playBootVoice()
    voiceRef.current = voice

    const check = window.setTimeout(() => {
      if (!voice.hasPlayed()) setNeedsGesture(true)
    }, 700)

    return () => {
      window.clearTimeout(check)
      voice.stop()
      voiceRef.current = null
    }
  }, [])

  useEffect(() => {
    const duration = reducedMotion ? Math.min(minDurationMs, 900) : minDurationMs
    const started = performance.now()
    let raf = 0
    let statusTimer = 0
    let doneTimer = 0
    let cancelled = false

    const fontsReady =
      typeof document !== 'undefined' && document.fonts?.ready
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve()

    statusTimer = window.setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, STATUS_KEYS.length - 1))
    }, Math.max(duration / STATUS_KEYS.length, 200))

    function tick(now: number) {
      if (cancelled) return
      const elapsed = now - started
      const p = Math.min(98, (elapsed / duration) * 100)
      setProgress(p)
      if (p < 98) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    void Promise.all([
      fontsReady,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, duration)
      }),
    ]).then(() => {
      if (cancelled) return
      setProgress(100)
      setStatusIndex(STATUS_KEYS.length - 1)
      doneTimer = window.setTimeout(
        () => {
          if (!cancelled) {
            voiceRef.current?.stop()
            setShowSplash(false)
          }
        },
        reducedMotion ? 80 : 280,
      )
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.clearInterval(statusTimer)
      window.clearTimeout(doneTimer)
    }
  }, [minDurationMs, reducedMotion])

  function handleUnlockSound() {
    voiceRef.current?.unlockAndPlay()
    setNeedsGesture(false)
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {showSplash && (
          <BootSplash
            key="boot-splash"
            progress={progress}
            statusIndex={statusIndex}
            needsGesture={needsGesture}
            onUnlockSound={handleUnlockSound}
          />
        )}
      </AnimatePresence>
    </>
  )
}
