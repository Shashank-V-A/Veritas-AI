import { motion } from 'framer-motion'
import { FileSearch, Scale, Stamp } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const STEPS = [
  {
    icon: FileSearch,
    title: 'Submit evidence',
    description: 'Paste text, upload a PDF, or try a sample claim.',
  },
  {
    icon: Scale,
    title: 'Forensic analysis',
    description: 'Claims, bias, fallacies, and manipulation signals — not chat.',
  },
  {
    icon: Stamp,
    title: 'Credibility dossier',
    description: 'Trust score, verdict, and exportable case file.',
  },
]

export function HowItWorks() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {STEPS.map((step, index) => (
        <motion.div
          key={step.title}
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="relative border-t-2 border-accent/25 pt-5"
        >
          <span className="font-mono text-[10px] text-foreground/45">
            Step {String(index + 1).padStart(2, '0')}
          </span>
          <step.icon className="mt-4 size-5 text-foreground" strokeWidth={1.5} />
          <h3 className="mt-3 font-display text-xl text-foreground">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/65">
            {step.description}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
