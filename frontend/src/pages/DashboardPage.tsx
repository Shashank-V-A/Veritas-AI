import { motion } from 'framer-motion'
import { slideUp } from '@/animations/variants'
import { AnalysisInput } from '@/components/analysis/AnalysisInput'
import { RecentAnalyses } from '@/components/analysis/RecentAnalyses'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function DashboardPage() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <motion.div
        variants={reducedMotion ? undefined : slideUp}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            New analysis
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Paste content to generate a credibility report.
          </p>
        </div>

        <AnalysisInput />

        <div className="mt-12">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Recent analyses
          </h2>
          <RecentAnalyses limit={5} />
        </div>
      </motion.div>
    </div>
  )
}
