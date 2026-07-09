import { motion } from 'framer-motion'
import { ClipboardPaste, FileBarChart, Sparkles } from 'lucide-react'
import { slideUp, staggerContainer } from '@/animations/variants'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const steps = [
  {
    icon: ClipboardPaste,
    step: '01',
    title: 'Paste your content',
    description:
      'Drop in an article, social post, YouTube transcript, WhatsApp forward, or any raw text.',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'AI analyzes credibility',
    description:
      'Our engine extracts claims, detects bias and fallacies, and evaluates emotional manipulation.',
  },
  {
    icon: FileBarChart,
    step: '03',
    title: 'Review your report',
    description:
      'Get a professional credibility report with trust scores, evidence, and a neutral rewrite.',
  },
]

export function HowItWorksSection() {
  const reducedMotion = useReducedMotion()

  return (
    <section id="how-it-works" className="border-t border-border px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            How it works
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            Three steps to verified information
          </h2>
        </div>

        <motion.div
          className="grid gap-8 md:grid-cols-3"
          variants={reducedMotion ? undefined : staggerContainer}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-60px' }}
        >
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              variants={slideUp}
              className="relative text-center"
            >
              {index < steps.length - 1 && (
                <div
                  className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-border md:block"
                  aria-hidden="true"
                />
              )}

              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-border bg-surface">
                <item.icon
                  className="size-7 text-accent"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-xs font-medium tabular-nums text-accent">
                {item.step}
              </p>
              <h3 className="mt-2 text-base font-medium text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
