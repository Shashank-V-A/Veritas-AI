import { motion } from 'framer-motion'
import type { TimelineEvent } from '@/types'
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
          className="relative flex gap-4 pb-8 last:pb-0"
          initial={reducedMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08, duration: 0.35 }}
        >
          {index < events.length - 1 && (
            <div
              className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-border"
              aria-hidden="true"
            />
          )}

          <div className="relative z-10 mt-1 size-[22px] shrink-0 rounded-full border-2 border-accent/40 bg-surface">
            <div className="absolute inset-1 rounded-full bg-accent/60" />
          </div>

          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-medium text-foreground">{event.step}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
