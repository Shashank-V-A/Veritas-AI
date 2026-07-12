import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { staggerContainer, slideUp } from '@/animations/variants'
import { EmotionRadar } from '@/components/charts/EmotionRadar'
import { BiasMeter } from '@/components/analysis/report/BiasMeter'
import { CaseAnnotations } from '@/components/analysis/report/CaseAnnotations'
import { ClaimBreakdown } from '@/components/analysis/report/ClaimBreakdown'
import { EvidenceLocker } from '@/components/analysis/report/EvidenceLocker'
import { EvidenceSignal } from '@/components/analysis/report/EvidenceSignal'
import { VerdictFeedbackForm } from '@/components/analysis/report/VerdictFeedbackForm'
import { ClaimGraph } from '@/components/analysis/report/ClaimGraph'
import { ClaimTimeline } from '@/components/analysis/report/ClaimTimeline'
import { ConfidenceIntervalBar } from '@/components/analysis/report/ConfidenceInterval'
import { DomainReputationBadge } from '@/components/analysis/report/DomainReputationBadge'
import { FallacyList } from '@/components/analysis/report/FallacyList'
import { MeshAttribution } from '@/components/analysis/report/MeshAttribution'
import { MissingContextCard } from '@/components/analysis/report/MissingContextCard'
import { SourceLineage } from '@/components/analysis/report/SourceLineage'
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
import type { AnalysisRecord } from '@veritas/shared'
import { useAnalyze } from '@/hooks/useAnalyze'
import { useDeleteReport } from '@/hooks/useDeleteReport'
import { useInvestigationSound } from '@/hooks/useInvestigationSound'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { investigationAudio } from '@/lib/investigationAudio'

interface ReportViewProps {
  record: AnalysisRecord
  readOnly?: boolean
}

export function ReportView({ record, readOnly = false }: ReportViewProps) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const deleteReport = useDeleteReport()
  const analyze = useAnalyze()
  useInvestigationSound(analyze.isReanalyzing)
  const { report } = record
  const caseId = formatCaseId(record.id)

  function handleDelete() {
    const confirmed = window.confirm(t('report.deleteConfirm'))
    if (confirmed) deleteReport.mutate(record.id)
  }

  function handleReanalyze() {
    investigationAudio.unlock()
    analyze.reanalyze(record.id)
  }

  return (
    <motion.div
      variants={reducedMotion ? undefined : staggerContainer}
      initial={reducedMotion ? false : 'hidden'}
      animate={reducedMotion ? false : 'visible'}
      className="space-y-8 print:space-y-4"
    >
      <VerdictBanner verdict={report.verdict} caseId={caseId} />

      {!readOnly && (
        <motion.div variants={slideUp}>
          <VerdictFeedbackForm
            analysisId={record.id}
            currentVerdict={report.verdict}
          />
        </motion.div>
      )}

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

      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm print:static print:border-0 print:bg-transparent md:-mx-8 md:px-8">
        <p className="meta-label text-accent">{t('report.executiveSummary')}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground print:line-clamp-none">
          {report.summary}
        </p>
      </div>

      <motion.div variants={slideUp} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="meta-label text-accent">{t('report.caseFile')} · {caseId}</p>
          <h1 className="mt-2 font-display text-2xl leading-snug text-foreground md:text-4xl print:text-2xl">
            {record.title ?? t('report.untitled')}
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {getSourceTypeLabel(record.sourceType)}
            {record.category ? ` · ${getCategoryLabel(record.category)}` : ''} ·{' '}
            {formatRelativeDate(record.createdAt)}
          </p>
        </div>
        <ReportActions
          record={record}
          onDelete={readOnly ? undefined : handleDelete}
          isDeleting={deleteReport.isPending}
          onReanalyze={readOnly ? undefined : handleReanalyze}
          isReanalyzing={analyze.isReanalyzing}
          readOnly={readOnly}
        />
      </motion.div>

      {record.sourceUrl && (
        <motion.div variants={slideUp}>
          <DomainReputationBadge sourceUrl={record.sourceUrl} />
        </motion.div>
      )}

      <motion.div variants={slideUp} className="space-y-3">
        <MeshAttribution model={record.meshModel} latencyMs={record.meshLatencyMs} />
        <EvidenceSignal report={report} meshModel={record.meshModel} />
      </motion.div>

      <motion.div variants={slideUp} className="grid gap-6 lg:grid-cols-[280px_1fr] print:grid-cols-1">
        <div className="dossier-panel flex flex-col items-center justify-center p-8 print:break-inside-avoid">
          <TrustScoreRing score={report.trustScore} variant="seal" />
        </div>
        <div className="dossier-panel p-6 md:p-8 print:break-inside-avoid">
          <p className="meta-label">{t('report.investigationSummary')}</p>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{report.summary}</p>
          {report.confidenceInterval && (
            <div className="mt-6">
              <p className="meta-label">
                {t('report.confidenceInterval')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('report.confidenceIntervalHint')}
              </p>
              <ConfidenceIntervalBar
                score={report.trustScore}
                interval={report.confidenceInterval}
                className="mt-2"
              />
            </div>
          )}
          <div className="case-rule my-6" />
          <Eli15Card text={report.eli15} compact />
        </div>
      </motion.div>

      {report.claimRelations && report.claimRelations.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection title={t('report.claimGraph')} description={t('report.claimGraphDesc')}>
            <ClaimGraph claims={report.claims} relations={report.claimRelations} />
          </ReportSection>
        </motion.div>
      )}

      {report.sourceLineage && report.sourceLineage.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection title={t('report.sourceLineage')} description={t('report.sourceLineageDesc')}>
            <SourceLineage items={report.sourceLineage} />
          </ReportSection>
        </motion.div>
      )}

      {report.claimTimeline && report.claimTimeline.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection title={t('report.claimTimeline')} description={t('report.claimTimelineDesc')}>
            <ClaimTimeline events={report.claimTimeline} />
          </ReportSection>
        </motion.div>
      )}

      <motion.div variants={slideUp}>
        <ReportSection
          title={t('report.evidenceLog')}
          description={t('report.evidenceLogDesc')}
        >
          <ClaimBreakdown
            claims={report.claims}
            analysisId={record.id}
            allowWatch={!readOnly}
          />
        </ReportSection>
      </motion.div>

      <motion.div variants={slideUp} className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
        <div className="dossier-panel p-6 print:break-inside-avoid">
          <ReportSection title={t('report.biasVectors')} description={t('report.biasDesc')}>
            <BiasMeter bias={report.bias} />
          </ReportSection>
        </div>
        <div className="dossier-panel p-6 print:break-inside-avoid">
          <ReportSection title={t('report.emotionProfile')} description={t('report.emotionDesc')}>
            <EmotionRadar emotion={report.emotion} />
          </ReportSection>
        </div>
      </motion.div>

      {report.fallacies.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection title={t('report.fallacies')} description={t('report.fallaciesDesc')}>
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
          title={t('report.rewrite')}
          description={t('report.rewriteDesc')}
        >
          <RewriteComparison original={record.content} neutral={report.neutralRewrite} />
        </ReportSection>
      </motion.div>

      {report.reasoningTimeline.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection title={t('report.trail')} description={t('report.trailDesc')}>
            <ReasoningTimeline events={report.reasoningTimeline} />
          </ReportSection>
        </motion.div>
      )}

      {report.suggestedReading.length > 0 && (
        <motion.div variants={slideUp}>
          <ReportSection title={t('report.furtherReading')} description={t('report.furtherReadingDesc')}>
            <SuggestedReading sources={report.suggestedReading} />
          </ReportSection>
        </motion.div>
      )}

      {!readOnly && (
        <motion.div variants={slideUp}>
          <ReportSection title={t('report.annotations')} description={t('report.privateNotes')}>
            <CaseAnnotations
              analysisId={record.id}
              claims={report.claims}
              readOnly={readOnly}
            />
          </ReportSection>
        </motion.div>
      )}

      {!readOnly && (
        <motion.div variants={slideUp}>
          <ReportSection title={t('evidence.title')} description={t('evidence.description')}>
            <EvidenceLocker analysisId={record.id} readOnly={readOnly} />
          </ReportSection>
        </motion.div>
      )}
    </motion.div>
  )
}
