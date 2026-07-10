import { Navigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fadeIn, slideUp, staggerContainer } from '@/animations/variants'
import { DetectiveBoard } from '@/components/landing/DetectiveBoard'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { HowItsDifferent } from '@/components/landing/HowItsDifferent'
import { LandingStats } from '@/components/landing/LandingStats'
import { SampleReportPreview } from '@/components/landing/SampleReportPreview'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen'
import { ROUTES } from '@/lib/constants'
import { SAMPLE_REPORT } from '@/lib/sampleReport'
import { useAuth } from '@/contexts/AuthContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function LandingPage() {
  const { t } = useTranslation()
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

  return (
    <div className="min-h-svh bg-[#090909] text-[#F5F5F5]">
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
                {t('landing.eyebrow')}
              </motion.p>

              <motion.h1
                variants={reducedMotion ? undefined : slideUp}
                className="mt-4 font-display text-[3.25rem] font-semibold leading-[0.95] tracking-tight text-foreground md:text-7xl lg:text-[5.25rem]"
              >
                {t('app.name').toUpperCase()}
              </motion.h1>

              <motion.p
                variants={reducedMotion ? undefined : slideUp}
                className="mt-4 font-display text-xl italic text-accent md:text-2xl lg:text-[1.75rem]"
              >
                {t('app.tagline')}
              </motion.p>

              <motion.p
                variants={reducedMotion ? undefined : slideUp}
                className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground md:text-base"
              >
                {t('landing.heroBody')}
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
                  {t('nav.startInvestigation')}
                  <ArrowRight className="size-4" strokeWidth={2} />
                </button>
                <a
                  href="#about"
                  className="inline-flex items-center gap-2 font-sans text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('landing.viewSample')}
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
        <HowItsDifferent />
        <HowItWorks />
        <LandingFeatures />

        {/* Sample dossier */}
        <section
          id="about"
          className="border-t border-border px-6 py-20 md:px-12"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                  {t('landing.sampleEyebrow')}
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-foreground md:text-4xl">
                  {t('landing.sampleTitle')}
                </h2>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                  {t('landing.sampleBody')}
                </p>
              </div>
              <span className="border border-accent/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                {t('landing.classifiedSample')}
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
                {t('landing.accessEyebrow')}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-foreground md:text-4xl">
                {t('landing.accessTitle')}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {t('landing.accessBody')}
              </p>
            </div>

            <div className="w-full max-w-sm space-y-4">
              {authError && (
                <div
                  className="border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-foreground"
                  role="alert"
                >
                  {t('landing.signInFailed')} {authError.replace(/_/g, ' ')}
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => setSearchParams({})}
                  >
                    {t('landing.dismiss')}
                  </button>
                </div>
              )}
              <GoogleSignInButton
                size="lg"
                variant="default"
                className="h-12 w-full uppercase tracking-[0.08em]"
                label={t('landing.continueGoogle')}
              />
              <p className="text-center font-mono text-[10px] text-muted-foreground">
                {t('landing.accessFoot')}
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-5">
          <div className="footer-marquee" aria-label={t('landing.footerAria')}>
            <div className="footer-marquee__track">
              {Array.from({ length: 2 }).map((_, loop) => (
                <p
                  key={loop}
                  className="footer-marquee__item font-mono text-[11px] tracking-[0.04em] text-muted-foreground"
                  aria-hidden={loop > 0}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span key={i}>
                      {t('app.name')} · {t('app.tagline')}
                      <span className="mx-8 text-accent/40" aria-hidden>
                        ◆
                      </span>
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </div>
        </footer>
    </div>
  )
}
