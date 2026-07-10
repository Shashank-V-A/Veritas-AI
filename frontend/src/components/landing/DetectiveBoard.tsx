import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

type PinId = 'trust' | 'source' | 'claim' | 'social' | 'photo' | 'herald'

const CONNECTIONS: Array<[PinId, PinId, { dashed?: boolean; opacity?: number }?]> = [
  ['trust', 'source', { opacity: 0.55 }],
  ['trust', 'claim', { opacity: 0.45 }],
  ['source', 'social', { opacity: 0.5 }],
  ['claim', 'social', { opacity: 0.45 }],
  ['claim', 'herald', { opacity: 0.5 }],
  ['photo', 'claim', { dashed: true, opacity: 0.4 }],
  ['photo', 'herald', { dashed: true, opacity: 0.35 }],
]

function TrustGauge({ score = 72, label }: { score?: number; label: string }) {
  const r = 42
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c

  return (
    <div className="relative flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#2A2A2A" strokeWidth="7" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="#C8A24A"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="font-display text-3xl font-semibold tabular-nums text-foreground">{score}</span>
        <span className="font-sans text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function Pin({
  className,
  pinRef,
}: {
  className?: string
  pinRef?: (el: HTMLSpanElement | null) => void
}) {
  return (
    <span
      ref={pinRef}
      className={cn(
        'absolute -top-1.5 left-1/2 z-20 size-2.5 -translate-x-1/2 rounded-full bg-[#C94F4F] shadow-[0_0_0_2px_rgba(201,79,79,0.25)]',
        className,
      )}
      aria-hidden
    />
  )
}

type LineSeg = {
  x1: number
  y1: number
  x2: number
  y2: number
  dashed?: boolean
  opacity: number
}

export function DetectiveBoard({ className }: { className?: string }) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const boardRef = useRef<HTMLDivElement>(null)
  const pinsRef = useRef<Partial<Record<PinId, HTMLSpanElement | null>>>({})
  const [lines, setLines] = useState<LineSeg[]>([])
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 })

  const setPin = useCallback((id: PinId) => (el: HTMLSpanElement | null) => {
    pinsRef.current[id] = el
  }, [])

  const measure = useCallback(() => {
    const board = boardRef.current
    if (!board) return
    const boardRect = board.getBoundingClientRect()
    if (boardRect.width < 8 || boardRect.height < 8) return

    setBoardSize({ w: boardRect.width, h: boardRect.height })

    const point = (id: PinId) => {
      const el = pinsRef.current[id]
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        x: r.left + r.width / 2 - boardRect.left,
        y: r.top + r.height / 2 - boardRect.top,
      }
    }

    const next: LineSeg[] = []
    for (const [from, to, opts] of CONNECTIONS) {
      const a = point(from)
      const b = point(to)
      if (!a || !b) continue
      next.push({
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        dashed: opts?.dashed,
        opacity: opts?.opacity ?? 0.5,
      })
    }
    setLines(next)
  }, [])

  useLayoutEffect(() => {
    measure()
    const board = boardRef.current
    if (!board) return

    const ro = new ResizeObserver(() => measure())
    ro.observe(board)

    // Re-measure after entrance animations settle
    const t1 = window.setTimeout(measure, 200)
    const t2 = window.setTimeout(measure, 700)

    return () => {
      ro.disconnect()
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [measure])

  return (
    <div
      ref={boardRef}
      className={cn(
        'relative aspect-[5/4] w-full overflow-hidden rounded-sm border border-white/[0.08] bg-[#121212]',
        className,
      )}
    >
      {/* Cork / slate texture */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 30% 20%, rgba(200,162,74,0.07), transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(95,126,167,0.06), transparent 45%),
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, auto, 28px 28px, 28px 28px',
        }}
      />

      {/* String connections — pinned pin-to-pin */}
      <svg
        className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible"
        width={boardSize.w || '100%'}
        height={boardSize.h || '100%'}
        aria-hidden
      >
        {lines.map((line, i) => (
          <motion.line
            key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#C8A24A"
            strokeWidth={line.dashed ? 1 : 1.25}
            strokeOpacity={line.opacity}
            strokeDasharray={line.dashed ? '4 4' : undefined}
            strokeLinecap="round"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.85, delay: 0.2 + i * 0.08 }}
          />
        ))}
      </svg>

      {/* Trust score card */}
      <motion.div
        className="absolute left-[6%] top-[8%] z-10 w-[38%] max-w-[160px] border border-border bg-elevated p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
        style={{ rotate: '-3deg' }}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onAnimationComplete={measure}
      >
        <Pin pinRef={setPin('trust')} />
        <p className="mb-1 font-sans text-[9px] uppercase tracking-[0.16em] text-accent">{t('landing.boardTrustScore')}</p>
        <TrustGauge score={72} label={t('landing.boardTrust')} />
        <p className="mt-1 text-center font-sans text-[10px] text-muted-foreground">{t('landing.boardModerate')}</p>
      </motion.div>

      {/* Source card */}
      <motion.div
        className="absolute right-[8%] top-[6%] z-10 w-[42%] max-w-[180px] border border-border bg-elevated p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        style={{ rotate: '2.5deg' }}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Pin className="bg-accent" pinRef={setPin('source')} />
        <p className="font-sans text-[9px] uppercase tracking-[0.14em] text-accent">{t('landing.boardSource')}</p>
        <p className="mt-1.5 font-display text-sm leading-snug text-foreground">
          {t('landing.boardSourceTitle')}
        </p>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">reuters.com</p>
        <span className="mt-2 inline-block border border-success/40 bg-success/10 px-1.5 py-0.5 font-mono text-[9px] text-success">
          {t('landing.boardVerifiedDomain')}
        </span>
      </motion.div>

      {/* Claim detected */}
      <motion.div
        className="absolute left-[10%] top-[46%] z-10 w-[44%] max-w-[190px] border border-border bg-elevated p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        style={{ rotate: '1.5deg' }}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Pin pinRef={setPin('claim')} />
        <p className="font-sans text-[9px] uppercase tracking-[0.14em] text-warning">{t('landing.boardClaimDetected')}</p>
        <p className="mt-1.5 font-display text-[13px] italic leading-snug text-foreground">
          {t('landing.boardClaimQuote')}
        </p>
        <p className="mt-2 font-mono text-[9px] text-danger">{t('landing.boardNeedsCheck')}</p>
      </motion.div>

      {/* Social post */}
      <motion.div
        className="absolute right-[6%] top-[42%] z-10 w-[40%] max-w-[170px] border border-border bg-elevated p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        style={{ rotate: '-2deg' }}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Pin className="bg-accent-secondary" pinRef={setPin('social')} />
        <p className="font-sans text-[9px] uppercase tracking-[0.14em] text-accent-secondary">{t('landing.boardSocialPost')}</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          {t('landing.boardSocialDesc')}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#2A2A2A]">
          <div className="h-full w-[78%] bg-danger/80" />
        </div>
        <p className="mt-1 font-mono text-[9px] text-danger">{t('landing.boardForwardRisk')}</p>
      </motion.div>

      {/* Photo + sticky note */}
      <motion.div
        className="absolute bottom-[8%] left-[18%] z-10 w-[36%] max-w-[150px]"
        style={{ rotate: '-4deg' }}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="relative border border-border bg-elevated p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
          <Pin pinRef={setPin('photo')} />
          <div
            className="aspect-[4/3] w-full"
            style={{
              background:
                'linear-gradient(145deg, #2a2a30 0%, #1a1a1f 40%, #3a3530 70%, #1c1c20 100%)',
            }}
          >
            <div className="flex h-full items-end p-2">
              <span className="font-mono text-[8px] text-white/50">IMG · crowd_01</span>
            </div>
          </div>
        </div>
        <div
          className="absolute -right-6 -top-3 z-10 w-[88px] bg-[#D9A441] px-2 py-1.5 shadow-md"
          style={{ rotate: '8deg' }}
        >
          <p className="font-sans text-[9px] leading-tight text-[#1a1a1f]">
            {t('landing.boardSticky')}
          </p>
        </div>
      </motion.div>

      {/* Newspaper clipping */}
      <motion.div
        className="absolute bottom-[6%] right-[8%] z-10 w-[40%] max-w-[170px] border border-border bg-[#e8e4dc] p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
        style={{ rotate: '3deg' }}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <Pin className="bg-[#8B2942]" pinRef={setPin('herald')} />
        <p className="font-display text-[11px] font-bold tracking-wide text-[#1a1a1f]">
          {t('landing.boardHerald')}
        </p>
        <div className="my-1 h-px bg-[#1a1a1f]/20" />
        <p className="font-display text-[10px] leading-snug text-[#2c2c30]">
          {t('landing.boardHeraldBody')}
        </p>
        <p className="mt-1 font-mono text-[8px] text-[#5c5a55]">Vol. 112 · {t('landing.boardEvidenceClip')}</p>
      </motion.div>
    </div>
  )
}
