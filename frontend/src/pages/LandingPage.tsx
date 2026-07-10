import { Navigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { fadeIn, slideUp, staggerContainer } from '@/animations/variants'
import { DetectiveBoard } from '@/components/landing/DetectiveBoard'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingIconRail } from '@/components/landing/LandingIconRail'
import { LandingStats } from '@/components/landing/LandingStats'
import { LiveInvestigationSection } from '@/components/landing/LiveInvestigationSection'
import { SampleReportPreview } from '@/components/landing/SampleReportPreview'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen'
import { ROUTES } from '@/lib/constants'
import { SAMPLE_REPORT } from '@/lib/sampleReport'
import { useAuth } from '@/contexts/AuthContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function LandingPage() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const reducedMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const authError = searchParams.get('auth_error')

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  function startInvestigation() {
    document.getElementById('live-investigation')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-svh bg-[#090909] text-[#F5F5F5]">
      <LandingIconRail />

      <div className="lg:pl-12">
        <LandingHeader onStart={login} />

        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-16 pt-10 md:px-12 md:pb-20 md:pt-14 lg:px-16">
          {/* Subtle slate texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 80% 50% at 10% 0%, rgba(200,162,74,0.06), transparent),
                radial-gradient(ellipse 60% 40% at 90% 20%, rgba(95,126,167,0.05), transparent),
                linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
              `,
              backgroundSize: 'auto, auto, 40px 40px, 40px 40px',
            }}
          />

          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-10 xl:gap-14">
            <motion.div
              variants={reducedMotion ? undefined : staggerContainer}
              initial={reducedMotion ? false : 'hidden'}
              animate={reducedMotion ? false : 'visible'}
            >
              <motion.p
                variants={reducedMotion ? undefined : fadeIn}
                className="font-sans text-[11px] font-medium uppercase tracking-[0.24em] text-accent"
              >
                Digital investigation platform
              </motion.p>

              <motion.h1
                variants={reducedMotion ? undefined : slideUp}
                className="mt-4 font-display text-[3.25rem] font-semibold leading-[0.95] tracking-tight text-foreground md:text-7xl lg:text-[5.25rem]"
              >
                VERITAS AI
              </motion.h1>

              <motion.p
                variants={reducedMotion ? undefined : slideUp}
                className="mt-4 font-display text-xl italic text-accent md:text-2xl lg:text-[1.75rem]"
              >
                Don&apos;t consume information. Verify it.
              </motion.p>

              <motion.p
                variants={reducedMotion ? undefined : slideUp}
                className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground md:text-base"
              >
                An AI-powered investigation desk for claims, sources, and narratives.
                Paste any article, forward, or transcript — receive a structured credibility
                dossier built for analysts, journalists, and decision-makers.
              </motion.p>

              <motion.div
                variants={reducedMotion ? undefined : slideUp}
                className="mt-9 flex flex-wrap items-center gap-4"
              >
                <button
                  type="button"
                  onClick={login}
                  className="pressable inline-flex h-12 items-center gap-2.5 bg-accent px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-accent/90"
                >
                  Start investigation
                  <ArrowRight className="size-4" strokeWidth={2} />
                </button>
                <a
                  href="#live-investigation"
                  onClick={(e) => {
                    e.preventDefault()
                    startInvestigation()
                  }}
                  className="inline-flex items-center gap-2 font-sans text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="flex size-8 items-center justify-center border border-border">
                    <Play className="size-3 fill-current" />
                  </span>
                  Watch demo
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <DetectiveBoard />
            </motion.div>
          </div>
        </section>

        <LandingStats />
        <HowItWorks />
        <LandingFeatures />

        {/* Live demo — preserves guest analyze functionality */}
        <div id="live-investigation" className="border-t border-border">
          <LiveInvestigationSection />
        </div>

        {/* Sample dossier */}
        <section
          id="about"
          className="border-t border-border px-6 py-20 md:px-12"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                  Sample dossier
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-foreground md:text-4xl">
                  What an investigation looks like
                </h2>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  A classified-style credibility report — trust score, claims, bias, and evidence.
                </p>
              </div>
              <span className="border border-accent/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                Classified sample
              </span>
            </div>
            <SampleReportPreview record={SAMPLE_REPORT} />
          </div>
        </section>

        {/* Sign in */}
        <section
          id="sign-in-section"
          className="border-t border-border bg-surface px-6 py-20 md:px-12"
        >
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 md:flex-row md:items-center">
            <div>
              <p className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                Access
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-foreground md:text-4xl">
                Open your investigation desk
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Sign in to run full analyses, archive case files, export PDF dossiers, and
                collaborate with your team.
              </p>
            </div>

            <div className="w-full max-w-sm space-y-4">
              {authError && (
                <div
                  className="border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-foreground"
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
                variant="default"
                className="h-12 w-full uppercase tracking-[0.08em]"
                label="Continue with Google"
              />
              <p className="text-center font-mono text-[10px] text-muted-foreground">
                Private archive · PDF export · Mesh-powered analysis
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-border px-6 py-6 text-center">
          <p className="font-mono text-[11px] text-muted-foreground">
            Veritas AI · Don&apos;t consume information. Verify it.
          </p>
        </footer>
      </div>
    </div>
  )
}
