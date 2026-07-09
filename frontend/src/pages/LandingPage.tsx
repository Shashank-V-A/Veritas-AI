import { Navigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fadeIn, slideUp, staggerContainer } from '@/animations/variants'
import { BeforeAfterDemo } from '@/components/landing/BeforeAfterDemo'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { LiveInvestigationSection } from '@/components/landing/LiveInvestigationSection'
import { ProblemStats } from '@/components/landing/ProblemStats'
import { SampleReportPreview } from '@/components/landing/SampleReportPreview'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen'
import { Logo } from '@/components/layout/Logo'
import { ROUTES } from '@/lib/constants'
import { SAMPLE_REPORT } from '@/lib/sampleReport'
import { useAuth } from '@/contexts/AuthContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const reducedMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const authError = searchParams.get('auth_error')

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return (
    <div className="min-h-svh">
      {/* Hero */}
      <section className="paper-parchment relative overflow-hidden px-6 py-16 md:px-12 md:py-24 lg:py-28">
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            variants={reducedMotion ? undefined : staggerContainer}
            initial={reducedMotion ? false : 'hidden'}
            animate={reducedMotion ? false : 'visible'}
          >
            <motion.header
              variants={reducedMotion ? undefined : fadeIn}
              className="flex items-center justify-between gap-4"
            >
              <Logo
                size="sm"
                linkTo={ROUTES.home}
                variant="on-light"
                className="pointer-events-none sm:pointer-events-auto"
              />
              <GoogleSignInButton
                size="sm"
                variant="default"
                className="hidden shadow-sm sm:inline-flex"
                label="Sign in"
              />
            </motion.header>

            <motion.div variants={reducedMotion ? undefined : slideUp} className="mt-16 max-w-3xl">
              <p className="font-mono text-xs text-foreground/55">
                Credibility intelligence · Forensic analysis
              </p>
              <h1 className="mt-4 font-display text-balance text-4xl leading-[1.1] text-foreground md:text-6xl lg:text-7xl">
                Chatbots speculate.
                <br />
                Veritas investigates.
              </h1>
              <div className="accent-line my-8 w-32" />
              <p className="max-w-xl text-base leading-relaxed text-foreground/75 md:text-lg">
                Paste any article, post, or PDF. Receive a structured credibility dossier —
                claims, bias, fallacies, evidence. Built for decision-makers, not chat addicts.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#sample-dossier"
                  className="inline-flex h-11 items-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  View sample dossier
                  <ArrowRight className="size-4" />
                </a>
                <p className="font-mono text-xs text-foreground/45">
                  No sign-in required to preview
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Before / After */}
      <section className="border-t border-foreground/10 bg-background px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl text-foreground md:text-3xl">
            Sensational input → forensic output
          </h2>
          <p className="mt-2 max-w-lg text-sm text-foreground/65">
            See how Veritas deconstructs viral misinformation into evidence-backed findings.
          </p>
          <div className="mt-8">
            <BeforeAfterDemo />
          </div>
        </div>
      </section>

      <ProblemStats />

      <LiveInvestigationSection />

      {/* Sample dossier */}
      <section
        id="sample-dossier"
        className="paper-ink border-t border-accent/20 px-6 py-16 md:px-12 md:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-accent/60">Live preview</p>
              <h2 className="mt-2 font-display text-2xl text-card-foreground md:text-3xl">
                Sample credibility dossier
              </h2>
              <p className="mt-2 text-sm text-card-foreground/60">
                Scroll the evidence log. This is what judges see — before they sign in.
              </p>
            </div>
            <span className="stamp border-accent text-accent">Classified sample</span>
          </div>
          <SampleReportPreview record={SAMPLE_REPORT} />
        </div>
      </section>

      {/* How it works */}
      <section className="paper-parchment border-t border-foreground/10 px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl text-foreground md:text-3xl">How it works</h2>
          <div className="mt-10">
            <HowItWorks />
          </div>
        </div>
      </section>

      {/* Sign in — secondary */}
      <section id="sign-in-section" className="paper-ink border-t border-accent/20 px-6 py-16 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl text-card-foreground md:text-3xl">
              Ready to run your own investigation?
            </h2>
            <p className="mt-2 max-w-md text-sm text-card-foreground/65">
              Sign in to analyze content, build your case archive, and export PDF dossiers.
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4">
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
              variant="default"
              className="h-12 w-full shadow-sm"
              label="Continue with Google"
            />
            <p className="text-center font-mono text-[10px] text-card-foreground/40">
              Private archive · PDF export · ⌘K command palette
            </p>
          </div>
        </div>
      </section>

      {/* Footer stat */}
      <div className="border-t border-accent/20 bg-surface px-6 py-4 text-center">
        <p className="font-mono text-xs text-accent-secondary/70">
          12+ signal dimensions · 100-point trust scale · Mesh API powered
        </p>
      </div>
    </div>
  )
}
