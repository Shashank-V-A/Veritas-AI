import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { staggerContainer, slideUp } from '@/animations/variants'
import { EmotionRadar } from '@/components/charts/EmotionRadar'
import { BiasMeter } from '@/components/analysis/report/BiasMeter'
import { ClaimBreakdown } from '@/components/analysis/report/ClaimBreakdown'
import { FallacyList } from '@/components/analysis/report/FallacyList'
import { MissingContextCard } from '@/components/analysis/report/MissingContextCard'
import { Eli15Card } from '@/components/analysis/report/VerdictCard'
import { ReasoningTimeline } from '@/components/analysis/report/ReasoningTimeline'
import { ReportActions } from '@/components/analysis/report/ReportActions'
import { ReportSection } from '@/components/analysis/report/ReportSection'
import { RewriteComparison } from '@/components/analysis/report/RewriteComparison'
import { SuggestedReading } from '@/components/analysis/report/SuggestedReading'
import { TrustScoreRing } from '@/components/analysis/report/TrustScoreRing'
import { VerdictBanner } from '@/components/analysis/report/VerdictBanner'
import { formatCaseId } from '@/lib/caseId'
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
  const caseId = formatCaseId(record.id)

  function handleDelete() {
    const confirmed = window.confirm(
      'Delete this case file permanently? This cannot be undone.',
    )
    if (confirmed) deleteReport.mutate(record.id)
  }

  return (
    <motion.div
      variants={reducedMotion ? undefined : staggerContainer}
      initial={reducedMotion ? false : 'hidden'}
      animate={reducedMotion ? false : 'visible'}
      className="space-y-8"
    >
      <VerdictBanner verdict={report.verdict} caseId={caseId} />

      {/* Sticky executive summary */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-accent/20 bg-surface/95 px-4 py-3 backdrop-blur-sm md:-mx-8 md:px-8">
        <p className="font-mono text-[10px] text-accent/60">Executive summary</p>
        <p className="mt-1 line-clamp-2 text-sm text-card-foreground/85">{report.summary}</p>
      </div>

      <motion.div variants={slideUp} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] text-accent/60">Case file · {caseId}</p>
          <h1 className="mt-2 font-display text-2xl leading-snug text-card-foreground md:text-4xl">
            {record.title ?? 'Untitled investigation'}
          </h1>
          <p className="mt-2 font-mono text-xs text-card-foreground/50">
            {getSourceTypeLabel(record.sourceType)} · {formatRelativeDate(record.createdAt)}
          </p>
        </div>
        <ReportActions
          record={record}
          onDelete={handleDelete}
          isDeleting={deleteReport.isPending}
        />
      </motion.div>

      <motion.div variants={slideUp} className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="dossier-panel flex flex-col items-center justify-center p-8">
          <TrustScoreRing score={report.trustScore} variant="seal" />
        </div>
        <div className="dossier-panel p-6 md:p-8">
          <p className="font-mono text-[10px] text-card-foreground/50">Investigation summary</p>
          <p className="mt-3 text-base leading-relaxed text-card-foreground/85">{report.summary}</p>
          <div className="case-rule my-6" />
          <Eli15Card text={report.eli15} compact />
        </div>
      </motion.div>

      <motion.div variants={slideUp}>
        <ReportSection
          title="Evidence log"
          description="Individual claims identified and evaluated"
        >
          <ClaimBreakdown claims={report.claims} />
        </ReportSection>
      </motion.div>

      <motion.div variants={slideUp} className="grid gap-6 lg:grid-cols-2">
        <div className="dossier-panel p-6">
          <ReportSection title="Bias vectors" description="Ideological and commercial lean">
            <BiasMeter bias={report.bias} />
          </ReportSection>
        </div>
        <div className="dossier-panel p-6">
          <ReportSection title="Emotion profile" description="Manipulation pattern scan">
            <EmotionRadar emotion={report.emotion} />
          </ReportSection>
        </div>
      </motion.div>

      {report.fallacies.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection title="Logical fallacies" description="Rhetorical weaknesses detected">
            <FallacyList fallacies={report.fallacies} />
          </ReportSection>
        </motion.div>
      )}

      {report.missingContext.length > 0 && (
        <motion.div variants={slideUp}>
          <MissingContextCard items={report.missingContext} />
        </motion.div>
      )}

      <motion.div variants={slideUp}>
        <ReportSection
          title="Source vs neutral rewrite"
          description="Side-by-side comparison"
        >
          <RewriteComparison original={record.content} neutral={report.neutralRewrite} />
        </ReportSection>
      </motion.div>

      {report.reasoningTimeline.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection title="Investigation trail" description="How this dossier was built">
            <ReasoningTimeline events={report.reasoningTimeline} />
          </ReportSection>
        </motion.div>
      )}

      {report.suggestedReading.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection title="Further reading" description="Verification resources">
            <SuggestedReading sources={report.suggestedReading} />
          </ReportSection>
        </motion.div>
      )}

      <motion.div variants={slideUp}>
        <div className="dossier-panel">
          <button
            type="button"
            onClick={() => setSourceExpanded((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-left"
            aria-expanded={sourceExpanded}
          >
            <p className="font-mono text-xs text-card-foreground/60">Original source material</p>
            <ChevronDown
              className={cn(
                'size-4 text-card-foreground/40 transition-transform',
                sourceExpanded && 'rotate-180',
              )}
              strokeWidth={1.75}
            />
          </button>
          {sourceExpanded && (
            <div className="border-t border-accent/15 px-4 pb-4">
              <p className="whitespace-pre-wrap pt-4 text-sm leading-relaxed text-card-foreground/70">
                {record.content}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
