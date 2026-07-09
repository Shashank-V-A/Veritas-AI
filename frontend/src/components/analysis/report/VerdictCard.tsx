import { FileText, Lightbulb } from 'lucide-react'
import type { CredibilityReport } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import {
  getVerdictColor,
  getVerdictLabel,
} from '@/lib/format'
import { cn } from '@/lib/utils'

interface VerdictCardProps {
  report: CredibilityReport
}

export function VerdictCard({ report }: VerdictCardProps) {
  return (
    <Card className="border-border bg-surface">
      <CardContent className="p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Final verdict
        </p>
        <span
          className={cn(
            'mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-medium',
            getVerdictColor(report.verdict),
          )}
        >
          {getVerdictLabel(report.verdict)}
        </span>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {report.summary}
        </p>
      </CardContent>
    </Card>
  )
}

interface NeutralRewriteCardProps {
  text: string
}

export function NeutralRewriteCard({ text }: NeutralRewriteCardProps) {
  return (
    <Card className="border-border bg-surface">
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-accent" strokeWidth={1.75} />
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Neutral rewrite
          </p>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}

interface Eli15CardProps {
  text: string
  compact?: boolean
}

export function Eli15Card({ text, compact }: Eli15CardProps) {
  if (compact) {
    return (
      <div>
        <p className="font-mono text-[10px] text-card-foreground/50">Plain-language brief</p>
        <p className="mt-2 text-sm leading-relaxed text-card-foreground/80">{text}</p>
      </div>
    )
  }

  return (
    <Card className="border-border bg-surface">
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-accent-secondary" strokeWidth={1.75} />
          <p className="font-mono text-[10px] text-muted-foreground">Plain-language brief</p>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}
