import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SourceLineageItem } from '@veritas/shared'
import { cn } from '@/lib/utils'

interface SourceLineageProps {
  items: SourceLineageItem[]
  className?: string
}

export function SourceLineage({ items, className }: SourceLineageProps) {
  const { t } = useTranslation()

  if (items.length === 0) return null

  return (
    <div className={cn('space-y-4', className)}>
      <p className="rounded-sm border border-accent/20 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        {t('report.searchContextNote')}
      </p>
      <ol className="space-y-4">
        {items.map((item, index) => (
          <li
            key={`${item.claim}-${index}`}
            className="border border-accent/15 bg-accent/5 p-4"
          >
            <p className="font-mono text-[10px] text-card-foreground/45">
              {t('report.claimN', { n: index + 1 })}
            </p>
            <p className="mt-1 text-sm text-card-foreground/85">{item.claim}</p>

            {item.sources.length > 0 && (
              <ul className="mt-3 space-y-2">
                {item.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 text-sm text-accent-secondary hover:text-accent"
                    >
                      <ExternalLink
                        className="mt-0.5 size-3.5 shrink-0 opacity-60 group-hover:opacity-100"
                        strokeWidth={1.5}
                      />
                      <span>
                        <span className="font-medium">{source.title}</span>
                        {source.snippet && (
                          <span className="mt-0.5 block text-xs text-card-foreground/55">
                            {source.snippet}
                          </span>
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
