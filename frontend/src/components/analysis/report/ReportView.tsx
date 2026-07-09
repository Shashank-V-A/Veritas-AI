import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { staggerContainer, slideUp } from '@/animations/variants'
import { EmotionRadar } from '@/components/charts/EmotionRadar'
import { BiasMeter } from '@/components/analysis/report/BiasMeter'
import { ClaimBreakdown } from '@/components/analysis/report/ClaimBreakdown'
import { ClaimHighlightedSource } from '@/components/analysis/report/ClaimHighlightedSource'
import { FallacyList } from '@/components/analysis/report/FallacyList'
import { MeshAttribution } from '@/components/analysis/report/MeshAttribution'
import { MissingContextCard } from '@/components/analysis/report/MissingContextCard'
import { Eli15Card } from '@/components/analysis/report/VerdictCard'
import { ReasoningTimeline } from '@/components/analysis/report/ReasoningTimeline'
import { ReportActions } from '@/components/analysis/report/ReportActions'
import { ReportSection } from '@/components/analysis/report/ReportSection'
import { RewriteComparison } from '@/components/analysis/report/RewriteComparison'
import { SuggestedReading } from '@/components/analysis/report/SuggestedReading'
import { TrustScoreRing } from '@/components/analysis/report/TrustScoreRing'
import { VerdictBanner } from '@/components/analysis/report/VerdictBanner'
import { VerdictChangelog } from '@/components/analysis/report/VerdictChangelog'
import { formatCaseId } from '@/lib/caseId'
import { getCategoryLabel } from '@/lib/categories'
import { formatRelativeDate } from '@/lib/format'
import { getSourceTypeLabel } from '@/lib/sourceTypes'
import { cn } from '@/lib/utils'
import type { AnalysisRecord } from '@veritas/shared'
import { useAnalyze } from '@/hooks/useAnalyze'
import { useDeleteReport } from '@/hooks/useDeleteReport'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface ReportViewProps {
  record: AnalysisRecord
  readOnly?: boolean
}

export function ReportView({ record, readOnly = false }: ReportViewProps) {
  const reducedMotion = useReducedMotion()
  const [sourceExpanded, setSourceExpanded] = useState(false)
  const deleteReport = useDeleteReport()
  const analyze = useAnalyze()
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
      className="space-y-8 print:space-y-4"
    >
      <VerdictBanner verdict={report.verdict} caseId={caseId} />

      {record.previousTrustScore != null && (
        <motion.div variants={slideUp}>
          <VerdictChangelog
            previousTrustScore={record.previousTrustScore}
            currentTrustScore={report.trustScore}
            previousVerdict={record.previousVerdict}
            currentVerdict={report.verdict}
            parentId={record.parentId}
          />
        </motion.div>
      )}

      <div className="sticky top-0 z-20 -mx-4 border-b border-accent/20 bg-surface/95 px-4 py-3 backdrop-blur-sm print:static print:border-0 print:bg-transparent md:-mx-8 md:px-8">
        <p className="font-mono text-[10px] text-accent/60">Executive summary</p>
        <p className="mt-1 line-clamp-2 text-sm text-card-foreground/85 print:line-clamp-none">
          {report.summary}
        </p>
      </div>

      <motion.div variants={slideUp} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] text-accent/60">Case file · {caseId}</p>
          <h1 className="mt-2 font-display text-2xl leading-snug text-card-foreground md:text-4xl print:text-2xl">
            {record.title ?? 'Untitled investigation'}
          </h1>
          <p className="mt-2 font-mono text-xs text-card-foreground/50">
            {getSourceTypeLabel(record.sourceType)}
            {record.category ? ` · ${getCategoryLabel(record.category)}` : ''} ·{' '}
            {formatRelativeDate(record.createdAt)}
          </p>
        </div>
        <ReportActions
          record={record}
          onDelete={readOnly ? undefined : handleDelete}
          isDeleting={deleteReport.isPending}
          onReanalyze={readOnly ? undefined : () => analyze.reanalyze(record.id)}
          isReanalyzing={analyze.isReanalyzing}
          readOnly={readOnly}
        />
      </motion.div>

      <motion.div variants={slideUp}>
        <MeshAttribution model={record.meshModel} latencyMs={record.meshLatencyMs} />
      </motion.div>

      <motion.div variants={slideUp} className="grid gap-6 lg:grid-cols-[280px_1fr] print:grid-cols-1">
        <div className="dossier-panel flex flex-col items-center justify-center p-8 print:break-inside-avoid">
          <TrustScoreRing score={report.trustScore} variant="seal" />
        </div>
        <div className="dossier-panel p-6 md:p-8 print:break-inside-avoid">
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

      <motion.div variants={slideUp} className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
        <div className="dossier-panel p-6 print:break-inside-avoid">
          <ReportSection title="Bias vectors" description="Ideological and commercial lean">
            <BiasMeter bias={report.bias} />
          </ReportSection>
        </div>
        <div className="dossier-panel p-6 print:break-inside-avoid">
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
        <div className="dossier-panel print:break-inside-avoid">
          <button
            type="button"
            onClick={() => setSourceExpanded((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-left print:hidden"
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
          <div className={cn('border-t border-accent/15 px-4 pb-4 print:border-0', !sourceExpanded && 'hidden print:block')}>
            <ClaimHighlightedSource
              content={record.content}
              claims={report.claims}
              fallacies={report.fallacies}
              className="pt-4"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
