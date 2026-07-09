import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CHART_COLORS } from '@/lib/chartColors'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const MOCK_CLAIMS = [
  { text: 'Vaccine linked to widespread harm', status: 'disputed', score: 34 },
  { text: 'Study sample size was 12 participants', status: 'verified', score: 78 },
  { text: 'Government cover-up alleged', status: 'unverified', score: 22 },
]

const MOCK_BIAS = [
  { label: 'Political', value: 72 },
  { label: 'Commercial', value: 28 },
  { label: 'Ideological', value: 65 },
]

export function DemoPreview() {
  const reducedMotion = useReducedMotion()
  const [trustScore, setTrustScore] = useState(0)
  const [activeClaim, setActiveClaim] = useState(0)

  useEffect(() => {
    if (reducedMotion) {
      setTrustScore(42)
      return
    }

    const scoreTimer = window.setInterval(() => {
      setTrustScore((s) => (s >= 42 ? 42 : s + 2))
    }, 40)

    const claimTimer = window.setInterval(() => {
      setActiveClaim((c) => (c + 1) % MOCK_CLAIMS.length)
    }, 2800)

    return () => {
      window.clearInterval(scoreTimer)
      window.clearInterval(claimTimer)
    }
  }, [reducedMotion])

  const radius = 40
  const stroke = 5
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const offset = circumference - (trustScore / 100) * circumference

  return (
    <section className="border-t border-border px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Live preview
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            See what a credibility report looks like
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Structured analysis with trust scores, claim breakdowns, and bias
            detection — not a chat response.
          </p>
        </div>

        <div className="relative mx-auto max-w-2xl">
          <div
            className="pointer-events-none absolute -inset-4 rounded-2xl bg-accent/[0.03] blur-2xl"
            aria-hidden="true"
          />

          <motion.div
            className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="size-2.5 rounded-full bg-border" />
              <div className="size-2.5 rounded-full bg-border" />
              <div className="size-2.5 rounded-full bg-border" />
              <span className="ml-2 text-xs text-muted-foreground">
                Credibility report
              </span>
            </div>

            <div className="grid gap-0 md:grid-cols-2">
              {/* Trust score */}
              <div className="flex flex-col items-center justify-center border-b border-border p-8 md:border-b-0 md:border-r">
                <div className="relative size-28">
                  <svg
                    className="size-full -rotate-90"
                    viewBox={`0 0 ${radius * 2} ${radius * 2}`}
                  >
                    <circle
                      cx={radius}
                      cy={radius}
                      r={normalizedRadius}
                      fill="none"
                      stroke={CHART_COLORS.grid}
                      strokeWidth={stroke}
                    />
                    <circle
                      cx={radius}
                      cy={radius}
                      r={normalizedRadius}
                      fill="none"
                      stroke={CHART_COLORS.accent}
                      strokeWidth={stroke}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold tabular-nums text-warning">
                      {trustScore}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-muted">
                      Trust
                    </span>
                  </div>
                </div>
                <span className="mt-3 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs text-warning">
                  Misleading
                </span>
              </div>

              {/* Claims */}
              <div className="p-5">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Claims
                </p>
                <div className="space-y-2">
                  <AnimatePresence mode="wait">
                    {MOCK_CLAIMS.map((claim, i) => (
                      <motion.div
                        key={claim.text}
                        className={`rounded-lg border px-3 py-2 transition-colors ${
                          i === activeClaim
                            ? 'border-accent/30 bg-accent/5'
                            : 'border-border bg-surface-secondary/40 opacity-50'
                        }`}
                        animate={{
                          opacity: i === activeClaim ? 1 : 0.45,
                          scale: i === activeClaim ? 1 : 0.98,
                        }}
                      >
                        <p className="text-xs leading-relaxed text-foreground">
                          {claim.text}
                        </p>
                        <p className="mt-1 text-[10px] capitalize text-muted-foreground">
                          {claim.status} · {claim.score}% confidence
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Bias bars */}
            <div className="border-t border-border p-5">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Bias detection
              </p>
              <div className="space-y-2">
                {MOCK_BIAS.map((bar) => (
                  <div key={bar.label}>
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span className="text-foreground">{bar.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                      <motion.div
                        className="h-full rounded-full bg-accent-secondary/70"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${bar.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
