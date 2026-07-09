import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { slideUp } from '@/animations/variants'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const comparisons = [
  {
    label: 'Structured credibility reports',
    veritas: true,
    chatbot: false,
  },
  {
    label: 'Claim-by-claim evidence breakdown',
    veritas: true,
    chatbot: false,
  },
  {
    label: 'Bias & fallacy detection',
    veritas: true,
    chatbot: false,
  },
  {
    label: 'Emotional manipulation scoring',
    veritas: true,
    chatbot: false,
  },
  {
    label: 'Neutral factual rewrite',
    veritas: true,
    chatbot: false,
  },
  {
    label: 'Conversation-style answers',
    veritas: false,
    chatbot: true,
  },
]

export function WhyVeritasSection() {
  const reducedMotion = useReducedMotion()

  return (
    <section id="why" className="border-t border-border px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <motion.div
          variants={reducedMotion ? undefined : slideUp}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'visible'}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Why Veritas AI
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            Not another chatbot
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Chatbots answer questions. Veritas AI produces auditable credibility
            reports you can act on.
          </p>
        </motion.div>

        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-border"
          variants={reducedMotion ? undefined : slideUp}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'visible'}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-3 border-b border-border bg-surface-secondary/50 text-center text-xs font-medium">
            <div className="p-3 text-muted-foreground" />
            <div className="border-l border-border p-3 text-accent">
              Veritas AI
            </div>
            <div className="border-l border-border p-3 text-muted-foreground">
              Chatbot
            </div>
          </div>

          {comparisons.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-3 border-b border-border last:border-b-0"
            >
              <div className="p-3 text-sm text-muted-foreground">{row.label}</div>
              <div className="flex items-center justify-center border-l border-border p-3">
                {row.veritas ? (
                  <Check className="size-4 text-success" strokeWidth={2} />
                ) : (
                  <X className="size-4 text-muted" strokeWidth={2} />
                )}
              </div>
              <div className="flex items-center justify-center border-l border-border p-3">
                {row.chatbot ? (
                  <Check className="size-4 text-muted-foreground" strokeWidth={2} />
                ) : (
                  <X className="size-4 text-muted" strokeWidth={2} />
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
