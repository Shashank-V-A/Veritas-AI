import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { APP_TAGLINE, ROUTES } from '@/lib/constants'
import { fadeIn, slideUp } from '@/animations/variants'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Why Veritas', href: '#why' },
]

export function NavBar() {
  const reducedMotion = useReducedMotion()
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <motion.header
      className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md"
      variants={reducedMotion ? undefined : fadeIn}
      initial={reducedMotion ? false : 'hidden'}
      animate={reducedMotion ? false : 'visible'}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo size="sm" />

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Landing navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!isLoading && !isAuthenticated && <GoogleSignInButton />}
          {!isLoading && isAuthenticated && (
            <div className="hidden md:block">
              <UserMenu />
            </div>
          )}
          <Button size="sm" asChild>
            <Link to={ROUTES.dashboard}>
              {isAuthenticated ? 'Dashboard' : 'Get started'}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.header>
  )
}

export function HeroSection() {
  const reducedMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-20 md:pb-32 md:pt-28">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/[0.04] blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[320px] w-[320px] rounded-full bg-accent-secondary/[0.03] blur-3xl" />
      </div>

      <motion.div
        className="relative mx-auto max-w-3xl text-center"
        variants={reducedMotion ? undefined : slideUp}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-accent" />
          Credibility analysis, not conversation
        </div>

        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {APP_TAGLINE}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Paste any article, post, or transcript. Veritas AI produces a
          professional credibility report — claims, bias, fallacies, and evidence
          — so you can decide what to trust.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link to={ROUTES.dashboard}>
              Analyze content
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
