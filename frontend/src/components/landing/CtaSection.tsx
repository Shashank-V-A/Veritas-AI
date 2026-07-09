import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { slideUp } from '@/animations/variants'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function CtaSection() {
  const reducedMotion = useReducedMotion()

  return (
    <section className="border-t border-border px-6 py-24">
      <motion.div
        className="mx-auto max-w-2xl text-center"
        variants={reducedMotion ? undefined : slideUp}
        initial={reducedMotion ? false : 'hidden'}
        whileInView={reducedMotion ? undefined : 'visible'}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Stop guessing. Start verifying.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Paste any content and get a professional credibility report in seconds.
          Free to try — no account required.
        </p>
        <Button size="lg" className="mt-8 gap-2" asChild>
          <Link to={ROUTES.dashboard}>
            Analyze your first article
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </motion.div>
    </section>
  )
}
