import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import type { TimelineEvent } from '@veritas/shared'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface ReasoningTimelineProps {
  events: TimelineEvent[]
}

export function ReasoningTimeline({ events }: ReasoningTimelineProps) {
  const reducedMotion = useReducedMotion()

  if (events.length === 0) return null

  return (
    <div className="relative space-y-0">
      {events.map((event, index) => (
        <motion.div
          key={`${event.step}-${index}`}
          className="relative flex gap-5 pb-10 last:pb-0"
          initial={reducedMotion ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          {index < events.length - 1 && (
            <div
              className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-accent/25"
              aria-hidden="true"
            />
          )}

          <div className="relative z-10 flex size-8 shrink-0 items-center justify-center border border-accent/40 bg-surface">
            <Search className="size-3.5 text-accent" strokeWidth={1.5} />
          </div>

          <div className="min-w-0 flex-1 border-l-2 border-accent/20 pl-4">
            <p className="font-mono text-[10px] text-accent/60">
              Phase {String(index + 1).padStart(2, '0')}
            </p>
            <p className="mt-1 text-sm font-medium text-card-foreground">{event.step}</p>
            <p className="mt-1 text-sm leading-relaxed text-card-foreground/65">
              {event.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
