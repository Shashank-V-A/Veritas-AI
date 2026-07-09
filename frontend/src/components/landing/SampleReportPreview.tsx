import { motion } from 'framer-motion'
import type { AnalysisRecord } from '@veritas/shared'
import { formatCaseId } from '@/lib/caseId'
import { getVerdictLabel } from '@/lib/format'
import { TrustScoreRing } from '@/components/analysis/report/TrustScoreRing'
import { ClaimCard } from '@/components/analysis/report/ClaimCard'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface SampleReportPreviewProps {
  record: AnalysisRecord
}

export function SampleReportPreview({ record }: SampleReportPreviewProps) {
  const reducedMotion = useReducedMotion()
  const { report } = record

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="paper-ink overflow-hidden border border-accent/25"
    >
      <div className="border-b border-accent/20 px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] text-accent/60">
              Sample dossier · {formatCaseId(record.id)}
            </p>
            <h3 className="mt-2 font-display text-xl text-card-foreground md:text-2xl">
              {record.title}
            </h3>
          </div>
          <span className="stamp border-accent text-accent">
            {getVerdictLabel(report.verdict)}
          </span>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
        <div className="flex items-center justify-center border-b border-accent/15 p-6 lg:border-b-0 lg:border-r">
          <TrustScoreRing score={report.trustScore} variant="seal" />
        </div>

        <div className="p-5 md:p-6">
          <p className="font-mono text-[10px] text-card-foreground/50">Executive summary</p>
          <p className="mt-2 text-sm leading-relaxed text-card-foreground/80">
            {report.summary}
          </p>

          <div className="case-rule my-5" />

          <p className="font-mono text-[10px] text-card-foreground/50">
            Evidence log · {report.claims.length} claims
          </p>
          <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {report.claims.slice(0, 2).map((claim, index) => (
              <ClaimCard key={claim.claim} claim={claim} index={index} variant="dossier" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
