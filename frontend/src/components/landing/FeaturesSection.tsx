import { motion } from 'framer-motion'
import {
  Brain,
  FileSearch,
  Fingerprint,
  MessageSquareOff,
  Scale,
  Shield,
} from 'lucide-react'
import { staggerContainer, slideUp } from '@/animations/variants'
import { Card, CardContent } from '@/components/ui/card'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const features = [
  {
    icon: FileSearch,
    title: 'Claim extraction',
    description:
      'Every assertion identified, classified, and evaluated with confidence scores and evidence.',
  },
  {
    icon: Scale,
    title: 'Bias & fallacy detection',
    description:
      'Political, commercial, and ideological bias surfaced alongside logical fallacies.',
  },
  {
    icon: Shield,
    title: 'Trust score',
    description:
      'A single credibility rating from 0–100 backed by transparent, auditable reasoning.',
  },
  {
    icon: Brain,
    title: 'Emotion analysis',
    description:
      'Detects fear, urgency, anger, sensationalism, and loaded language patterns.',
  },
  {
    icon: MessageSquareOff,
    title: 'Neutral rewrite',
    description:
      'Emotionally loaded text rewritten into neutral, factual language you can verify.',
  },
  {
    icon: Fingerprint,
    title: 'Source reasoning',
    description:
      'A step-by-step timeline showing exactly how the report was constructed.',
  },
]

export function FeaturesSection() {
  const reducedMotion = useReducedMotion()

  return (
    <section id="features" className="border-t border-border px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Features
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            Everything you need to verify information
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Ten analysis dimensions in one structured report. No chat threads, no
            hallucinated answers.
          </p>
        </div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={reducedMotion ? undefined : staggerContainer}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'visible'}
          viewport={{ once: true, margin: '-60px' }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={slideUp}>
              <Card className="group h-full border-border bg-surface transition-all hover:border-border hover:bg-surface-secondary/30 hover:shadow-lg hover:shadow-black/20">
                <CardContent className="p-6">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-border bg-surface-secondary transition-colors group-hover:border-accent/20 group-hover:bg-accent/5">
                    <feature.icon
                      className="size-5 text-accent transition-transform group-hover:scale-110"
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-base font-medium text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
