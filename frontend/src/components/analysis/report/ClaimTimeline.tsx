import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { ClaimTimelineEvent } from '@veritas/shared'
import { cn } from '@/lib/utils'

interface ClaimTimelineProps {
  events: ClaimTimelineEvent[]
  className?: string
}

function formatDate(value?: string): string | null {
  if (!value) return null
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return value
  }
}

export function ClaimTimeline({ events, className }: ClaimTimelineProps) {
  if (events.length === 0) return null

  return (
    <ol className={cn('relative space-y-0', className)}>
      {events.map((event, index) => {
        const appeared = formatDate(event.appearedAt)
        const debunked = formatDate(event.debunkedAt)
        const isLast = index === events.length - 1

        return (
          <li key={`${event.claim}-${index}`} className="relative flex gap-4 pb-6">
            {!isLast && (
              <span
                className="absolute left-[11px] top-6 h-full w-px bg-accent/20"
                aria-hidden="true"
              />
            )}

            <div className="relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center border border-accent/30 bg-surface">
              {event.status === 'false' || debunked ? (
                <XCircle className="size-3.5 text-danger" strokeWidth={1.5} />
              ) : event.status === 'verified' ? (
                <CheckCircle2 className="size-3.5 text-success" strokeWidth={1.5} />
              ) : (
                <Clock className="size-3.5 text-warning" strokeWidth={1.5} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-card-foreground/85">{event.claim}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-card-foreground/50">
                <span className="uppercase tracking-wide">{event.status}</span>
                {appeared && <span>Appeared · {appeared}</span>}
                {debunked && <span>Debunked · {debunked}</span>}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
