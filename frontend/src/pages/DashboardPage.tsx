import { motion } from 'framer-motion'
import { staggerContainer, slideUp } from '@/animations/variants'
import { AnalysisInput } from '@/components/analysis/AnalysisInput'
import { RecentAnalyses } from '@/components/analysis/RecentAnalyses'
import { useAuth } from '@/contexts/AuthContext'
import { useHistory } from '@/hooks/useHistory'
import { useReducedMotion } from '@/hooks/useReducedMotion'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const reducedMotion = useReducedMotion()
  const { user } = useAuth()
  const { data } = useHistory({ limit: 100 })
  const total = data?.total ?? 0
  const firstName = user?.name?.split(' ')[0]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-10 md:py-12">
      <motion.div
        variants={reducedMotion ? undefined : staggerContainer}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <motion.header variants={reducedMotion ? undefined : slideUp} className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ''}
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-card-foreground md:text-4xl">
            Verify before you trust
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-card-foreground/65">
            Drop content below. Veritas returns a structured credibility dossier —
            not opinions, not chat, only evidence.
          </p>

          <div className="mt-8 flex gap-8 border-t border-accent/20 pt-6">
            <div>
              <p className="text-2xl font-semibold text-accent">{total}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-card-foreground/50">
                Reports run
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-card-foreground">Private</p>
              <p className="text-xs font-medium uppercase tracking-wide text-card-foreground/50">
                Your archive
              </p>
            </div>
          </div>
        </motion.header>

        <motion.div variants={reducedMotion ? undefined : slideUp}>
          <AnalysisInput />
        </motion.div>

        <motion.section
          variants={reducedMotion ? undefined : slideUp}
          className="mt-14"
        >
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-card-foreground/50">
                Recent
              </p>
              <h2 className="mt-1 text-xl font-semibold text-card-foreground">
                Your analyses
              </h2>
            </div>
          </div>
          <RecentAnalyses limit={5} />
        </motion.section>
      </motion.div>
    </div>
  )
}
