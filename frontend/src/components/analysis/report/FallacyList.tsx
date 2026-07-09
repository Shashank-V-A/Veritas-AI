import { AlertTriangle } from 'lucide-react'
import type { Fallacy } from '@/types'
import { Badge } from '@/components/ui/badge'

interface FallacyListProps {
  fallacies: Fallacy[]
}

export function FallacyList({ fallacies }: FallacyListProps) {
  if (fallacies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No logical fallacies detected.
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fallacies.map((fallacy) => (
        <div
          key={`${fallacy.type}-${fallacy.excerpt}`}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle
                className="size-4 text-warning"
                strokeWidth={1.75}
              />
            </div>
            <div className="min-w-0">
              <Badge
                variant="outline"
                className="border-warning/30 bg-warning/5 text-warning"
              >
                {fallacy.type}
              </Badge>
              <p className="mt-2 text-xs italic text-muted-foreground">
                &ldquo;{fallacy.excerpt}&rdquo;
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {fallacy.explanation}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
