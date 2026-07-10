import { motion } from 'framer-motion'
import { slideUp } from '@/animations/variants'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const STATS = [
  {
    value: '62%',
    label: 'of adults encounter health misinformation monthly',
    source: 'WHO digital health survey',
  },
  {
    value: '4×',
    label: 'faster false claims spread than corrections',
    source: 'MIT misinformation research',
  },
  {
    value: '73%',
    label: 'of forwarded messages lack verifiable sources',
    source: 'Veritas intake analysis',
  },
] as const

export function ProblemStats() {
  const reducedMotion = useReducedMotion()

  return (
    <section className="border-t border-foreground/10 bg-background px-6 py-14 md:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs text-foreground/50">The problem</p>
        <h2 className="mt-2 font-display text-2xl text-foreground md:text-3xl">
          Misinformation scales faster than scrutiny
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={reducedMotion ? undefined : slideUp}
              initial={reducedMotion ? undefined : 'hidden'}
              whileInView={reducedMotion ? undefined : 'visible'}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: index * 0.08 }}
              className="border border-foreground/10 bg-surface p-6"
            >
              <p className="font-display text-4xl text-oxblood md:text-5xl">{stat.value}</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/75">{stat.label}</p>
              <p className="mt-3 font-mono text-[10px] text-foreground/40">{stat.source}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
