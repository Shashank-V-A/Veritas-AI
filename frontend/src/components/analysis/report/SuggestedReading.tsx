import { ExternalLink } from 'lucide-react'
import type { SuggestedSource } from '@/types'

interface SuggestedReadingProps {
  sources: SuggestedSource[]
}

export function SuggestedReading({ sources }: SuggestedReadingProps) {
  if (sources.length === 0) return null

  return (
    <div className="space-y-3">
      {sources.map((source) => (
        <div
          key={`${source.title}-${source.reason}`}
          className="rounded-xl border border-border bg-surface-secondary/60 p-4 transition-colors hover:bg-surface-secondary"
        >
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-oxblood dark:text-white dark:hover:text-brass"
            >
              {source.title}
              <ExternalLink
                className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                strokeWidth={1.75}
              />
            </a>
          ) : (
            <p className="text-sm font-medium text-ink dark:text-white">{source.title}</p>
          )}
          <p className="mt-1 text-xs leading-relaxed text-ink/80 dark:text-white/90">
            {source.reason}
          </p>
        </div>
      ))}
    </div>
  )
}
