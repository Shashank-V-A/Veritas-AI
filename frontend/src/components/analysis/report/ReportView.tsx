import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { staggerContainer, slideUp } from '@/animations/variants'
import { EmotionRadar } from '@/components/charts/EmotionRadar'
import { BiasMeter } from '@/components/analysis/report/BiasMeter'
import { ClaimBreakdown } from '@/components/analysis/report/ClaimBreakdown'
import { FallacyList } from '@/components/analysis/report/FallacyList'
import { MissingContextCard } from '@/components/analysis/report/MissingContextCard'
import {
  Eli15Card,
  NeutralRewriteCard,
  VerdictCard,
} from '@/components/analysis/report/VerdictCard'
import { ReasoningTimeline } from '@/components/analysis/report/ReasoningTimeline'
import { ReportActions } from '@/components/analysis/report/ReportActions'
import { ReportSection } from '@/components/analysis/report/ReportSection'
import { SuggestedReading } from '@/components/analysis/report/SuggestedReading'
import { TrustScoreRing } from '@/components/analysis/report/TrustScoreRing'
import { Card, CardContent } from '@/components/ui/card'
import { formatRelativeDate } from '@/lib/format'
import { getSourceTypeLabel } from '@/lib/sourceTypes'
import { cn } from '@/lib/utils'
import type { AnalysisRecord } from '@veritas/shared'
import { useDeleteReport } from '@/hooks/useDeleteReport'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface ReportViewProps {
  record: AnalysisRecord
}

export function ReportView({ record }: ReportViewProps) {
  const reducedMotion = useReducedMotion()
  const [sourceExpanded, setSourceExpanded] = useState(false)
  const deleteReport = useDeleteReport()
  const { report } = record

  function handleDelete() {
    const confirmed = window.confirm(
      'Delete this analysis permanently? This cannot be undone.',
    )
    if (confirmed) deleteReport.mutate(record.id)
  }

  return (
    <motion.div
      variants={reducedMotion ? undefined : staggerContainer}
      initial={reducedMotion ? false : 'hidden'}
      animate={reducedMotion ? false : 'visible'}
      className="space-y-10"
    >
      {/* Header */}
      <motion.div variants={slideUp} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Credibility report
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-snug tracking-tight text-card-foreground md:text-3xl">
            {record.title ?? 'Untitled analysis'}
          </h1>
          <p className="mt-1.5 text-sm text-card-foreground/60">
            {getSourceTypeLabel(record.sourceType)} ·{' '}
            {formatRelativeDate(record.createdAt)}
          </p>
        </div>
        <ReportActions
          record={record}
          onDelete={handleDelete}
          isDeleting={deleteReport.isPending}
        />
      </motion.div>

      {/* Trust score + verdict */}
      <motion.div variants={slideUp} className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-surface">
          <CardContent className="flex items-center justify-center p-8">
            <TrustScoreRing score={report.trustScore} />
          </CardContent>
        </Card>
        <VerdictCard report={report} />
      </motion.div>

      {/* Claims */}
      <motion.div variants={slideUp}>
        <ReportSection
          title="Claim breakdown"
          description="Individual assertions identified and evaluated"
        >
          <ClaimBreakdown claims={report.claims} />
        </ReportSection>
      </motion.div>

      {/* Bias + Emotion */}
      <motion.div variants={slideUp} className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <ReportSection
              title="Bias meter"
              description="Political, commercial, and ideological lean"
            >
              <BiasMeter bias={report.bias} />
            </ReportSection>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <ReportSection
              title="Emotion analysis"
              description="Emotional manipulation patterns detected"
            >
              <EmotionRadar emotion={report.emotion} />
            </ReportSection>
          </CardContent>
        </Card>
      </motion.div>

      {/* Fallacies */}
      <motion.div variants={slideUp}>
        <ReportSection
          title="Logical fallacies"
          description="Rhetorical patterns that weaken credibility"
        >
          <FallacyList fallacies={report.fallacies} />
        </ReportSection>
      </motion.div>

      {/* Missing context */}
      {report.missingContext.length > 0 && (
        <motion.div variants={slideUp}>
          <MissingContextCard items={report.missingContext} />
        </motion.div>
      )}

      {/* Neutral rewrite + ELI15 */}
      <motion.div variants={slideUp} className="grid gap-4 lg:grid-cols-2">
        <NeutralRewriteCard text={report.neutralRewrite} />
        <Eli15Card text={report.eli15} />
      </motion.div>

      {/* Timeline */}
      {report.reasoningTimeline.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection
            title="Source reasoning"
            description="How this report was constructed"
          >
            <Card className="border-border bg-surface">
              <CardContent className="p-6">
                <ReasoningTimeline events={report.reasoningTimeline} />
              </CardContent>
            </Card>
          </ReportSection>
        </motion.div>
      )}

      {/* Suggested reading */}
      {report.suggestedReading.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection
            title="Suggested reading"
            description="Resources for further verification"
          >
            <SuggestedReading sources={report.suggestedReading} />
          </ReportSection>
        </motion.div>
      )}

      {/* Original source */}
      <motion.div variants={slideUp}>
        <div className="rounded-xl border border-border bg-surface">
          <button
            type="button"
            onClick={() => setSourceExpanded((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-left"
            aria-expanded={sourceExpanded}
          >
            <p className="text-sm font-medium text-foreground">
              Original content
            </p>
            <ChevronDown
              className={cn(
                'size-4 text-muted transition-transform',
                sourceExpanded && 'rotate-180',
              )}
              strokeWidth={1.75}
            />
          </button>
          {sourceExpanded && (
            <div className="border-t border-border px-4 pb-4">
              <p className="whitespace-pre-wrap pt-4 text-sm leading-relaxed text-muted-foreground">
                {record.content}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
