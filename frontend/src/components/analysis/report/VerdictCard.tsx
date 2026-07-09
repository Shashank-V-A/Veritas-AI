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
}

export function Eli15Card({ text }: Eli15CardProps) {
  return (
    <Card className="border-border bg-surface">
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-accent-secondary" strokeWidth={1.75} />
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Explain like I&apos;m 15
          </p>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}
