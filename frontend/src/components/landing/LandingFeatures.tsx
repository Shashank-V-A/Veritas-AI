import { Check, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const FEATURES = [
  'AI-Powered Claim Analysis',
  'Bias & Manipulation Detection',
  'Source Verification Engine',
  'Logical Fallacy Detection',
  'Neutral Rewrite & Explanations',
] as const

function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-sm border border-white/10 bg-[#0d0d0d] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="size-2 rounded-full bg-[#C94F4F]/80" />
        <span className="size-2 rounded-full bg-[#D9A441]/80" />
        <span className="size-2 rounded-full bg-[#3BA55D]/80" />
        <span className="ml-3 font-mono text-[10px] text-muted-foreground">VA-2026-0148 · Active case</span>
      </div>

      <div className="grid md:grid-cols-[140px_1fr]">
        {/* Mini sidebar */}
        <aside className="hidden border-r border-border bg-[#111] p-3 md:block">
          <p className="font-mono text-[9px] uppercase tracking-widest text-accent">Veritas</p>
          <ul className="mt-4 space-y-2 font-sans text-[10px] text-muted-foreground">
            {['New Investigation', 'Dashboard', 'Case Archive', 'Sources', 'Bookmarks', 'Alerts', 'Settings'].map(
              (item, i) => (
                <li
                  key={item}
                  className={i === 1 ? 'text-accent' : ''}
                >
                  {item}
                </li>
              ),
            )}
          </ul>
          <div className="mt-8 border-t border-border pt-3">
            <p className="text-[10px] text-foreground">Arjun Mehta</p>
            <p className="font-mono text-[9px] text-muted-foreground">Investigator</p>
          </div>
        </aside>

        {/* Main panel */}
        <div className="space-y-3 p-3 md:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] text-accent">Case file</p>
              <p className="font-display text-lg text-foreground">Market jobs brief</p>
            </div>
            <div className="relative flex size-[72px] shrink-0 items-center justify-center">
              <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
                <circle cx="36" cy="36" r="28" fill="none" stroke="#2A2A2A" strokeWidth="5" />
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  fill="none"
                  stroke="#C8A24A"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - 0.72)}
                />
              </svg>
              <span className="absolute font-display text-lg text-foreground">72</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { n: '17', l: 'Verified', c: 'text-success' },
              { n: '5', l: 'Unverified', c: 'text-warning' },
              { n: '3', l: 'False', c: 'text-danger' },
            ].map((s) => (
              <div key={s.l} className="border border-border bg-elevated px-2 py-2">
                <p className={`font-display text-base ${s.c}`}>{s.n}</p>
                <p className="font-mono text-[8px] text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>

          <div className="border border-border bg-elevated p-2.5">
            <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">Bias detection</p>
            <div className="relative mt-2 h-1.5 rounded-full bg-[#2A2A2A]">
              <div className="absolute left-[38%] top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-accent" />
            </div>
            <p className="mt-1.5 font-sans text-[10px] text-foreground">Moderate Left</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="border border-border bg-elevated p-2.5">
              <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">Evidence sources</p>
              <ul className="mt-2 space-y-1 font-sans text-[10px] text-foreground">
                <li className="flex justify-between"><span>News articles</span><span className="text-accent">8</span></li>
                <li className="flex justify-between"><span>Gov. reports</span><span className="text-accent">3</span></li>
                <li className="flex justify-between"><span>Social posts</span><span className="text-accent">12</span></li>
              </ul>
            </div>
            <div className="border border-border bg-elevated p-2.5">
              <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">Timeline</p>
              <ul className="mt-2 space-y-1 font-mono text-[9px] text-muted-foreground">
                <li>14:02 Claim extraction</li>
                <li>14:03 Source retrieval</li>
                <li>14:05 Bias scan</li>
                <li className="text-accent">14:06 Report ready</li>
              </ul>
            </div>
          </div>

          {/* Mini evidence map */}
          <div className="relative h-20 border border-border bg-[#111] p-2">
            <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">Evidence map</p>
            <svg className="absolute inset-0 mt-3 h-full w-full" aria-hidden>
              <line x1="20%" y1="55%" x2="45%" y2="40%" stroke="#C8A24A" strokeOpacity="0.4" />
              <line x1="45%" y1="40%" x2="70%" y2="55%" stroke="#C8A24A" strokeOpacity="0.4" />
              <line x1="45%" y1="40%" x2="50%" y2="75%" stroke="#C8A24A" strokeOpacity="0.35" />
              <circle cx="20%" cy="55%" r="4" fill="#C8A24A" />
              <circle cx="45%" cy="40%" r="5" fill="#5F7EA7" />
              <circle cx="70%" cy="55%" r="4" fill="#C8A24A" />
              <circle cx="50%" cy="75%" r="3.5" fill="#C94F4F" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingFeatures() {
  const reducedMotion = useReducedMotion()

  return (
    <section id="features" className="border-t border-border px-6 py-20 md:px-12 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
        >
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
            Capabilities
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-foreground md:text-5xl">
            Built for those who seek the truth.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center border border-accent/40 bg-accent/10">
                  <Check className="size-3 text-accent" strokeWidth={2.5} />
                </span>
                <span className="text-sm text-foreground md:text-base">{feature}</span>
              </li>
            ))}
          </ul>
          <a
            href="#about"
            className="mt-8 inline-flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-accent transition-opacity hover:opacity-80"
          >
            View sample dossier
            <LayoutDashboard className="size-3.5" strokeWidth={1.5} />
          </a>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  )
}
