import { Navigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Shield, Sparkles } from 'lucide-react'
import {
  fadeIn,
  revealLine,
  slideLeft,
  slideRight,
  staggerContainer,
} from '@/animations/variants'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen'
import { APP_NAME, APP_TAGLINE, ROUTES } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const PROOF_POINTS = [
  'Claim-level verification',
  'Bias & fallacy detection',
  'Evidence-backed trust scores',
  'Structured credibility reports',
  'No chat — only analysis',
]

const STATS = [
  { value: '12+', label: 'Signal dimensions' },
  { value: '4s', label: 'Avg. report time' },
  { value: '100', label: 'Trust score scale' },
]

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const reducedMotion = useReducedMotion()
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const authError = searchParams.get('auth_error')

  useEffect(() => {
    if (reducedMotion) return
    const timer = window.setInterval(() => {
      setPhraseIndex((i) => (i + 1) % PROOF_POINTS.length)
    }, 3200)
    return () => window.clearInterval(timer)
  }, [reducedMotion])

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return (
    <div className="grain relative min-h-svh overflow-hidden">
      <div className="relative z-10 mx-auto grid min-h-svh max-w-[1400px] lg:grid-cols-2">
        {/* Gold editorial panel */}
        <motion.section
          className="flex flex-col justify-between bg-background px-6 py-10 text-foreground md:px-12 md:py-14"
          variants={reducedMotion ? undefined : staggerContainer}
          initial={reducedMotion ? false : 'hidden'}
          animate={reducedMotion ? false : 'visible'}
        >
          <motion.header variants={reducedMotion ? undefined : fadeIn}>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center border border-black/20 bg-black/5">
                <Shield className="size-4 text-foreground" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                {APP_NAME}
              </span>
            </div>
          </motion.header>

          <div className="my-16 max-w-xl lg:my-0 lg:py-20">
            <motion.p
              variants={reducedMotion ? undefined : slideRight}
              className="mb-4 text-xs font-semibold uppercase tracking-wide text-foreground/70"
            >
              Credibility intelligence
            </motion.p>

            <motion.h1
              variants={reducedMotion ? undefined : slideRight}
              className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-[3.5rem]"
            >
              {APP_TAGLINE}
            </motion.h1>

            <motion.div
              variants={reducedMotion ? undefined : revealLine}
              className="gold-line my-8 w-24 origin-left"
            />

            <motion.p
              variants={reducedMotion ? undefined : slideRight}
              className="max-w-md text-base leading-relaxed text-foreground/75 md:text-lg"
            >
              Paste any article, post, or transcript. Receive a forensic credibility
              report — claims, bias, fallacies, evidence — built for decision-makers,
              not chat addicts.
            </motion.p>

            <motion.div
              variants={reducedMotion ? undefined : slideRight}
              className="mt-10 h-8 overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={phraseIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45 }}
                  className="flex items-center gap-2 text-sm text-foreground/80"
                >
                  <Sparkles className="size-3.5 text-foreground" />
                  {PROOF_POINTS[phraseIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </div>

          <motion.footer
            variants={reducedMotion ? undefined : fadeIn}
            className="hidden items-end justify-between border-t border-black/10 pt-8 lg:flex"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-foreground/55">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.footer>
        </motion.section>

        {/* Black login panel */}
        <motion.section
          className="flex items-center justify-center bg-surface px-6 py-12 text-card-foreground md:px-12 lg:py-0"
          variants={reducedMotion ? undefined : slideLeft}
          initial={reducedMotion ? false : 'hidden'}
          animate={reducedMotion ? false : 'visible'}
        >
          <div className="panel-dark w-full max-w-md p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Members only
            </p>
            <h2 className="mt-4 text-2xl font-semibold leading-snug text-card-foreground md:text-3xl">
              Enter the workspace
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-card-foreground/70">
              Sign in to run analyses, access your report archive, and build a
              personal credibility audit trail. Your data stays private to your
              account.
            </p>

            <div className="mt-8 space-y-4">
              {authError && (
                <div
                  className="border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-card-foreground"
                  role="alert"
                >
                  Sign-in failed: {authError.replace(/_/g, ' ')}
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => setSearchParams({})}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <GoogleSignInButton
                size="lg"
                className="h-12 w-full border-accent/40 bg-accent text-primary hover:bg-accent/90 hover:text-primary"
                label="Continue with Google"
              />

              <ul className="space-y-2.5 border-t border-accent/20 pt-6">
                {[
                  'Private analysis history',
                  'Personal trust score archive',
                  'Export-ready credibility reports',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-sm text-card-foreground/65"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-8 text-center text-xs leading-relaxed text-card-foreground/45">
              By continuing, you agree to use Veritas for verification — not
              speculation.
            </p>
          </div>
        </motion.section>
      </div>

      {/* Marquee strip */}
      <div className="relative z-10 overflow-hidden border-t border-black/10 bg-background py-3">
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
          {[...PROOF_POINTS, ...PROOF_POINTS].map((point, i) => (
            <span
              key={`${point}-${i}`}
              className="text-xs font-medium uppercase tracking-wide text-foreground/45"
            >
              {point}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
