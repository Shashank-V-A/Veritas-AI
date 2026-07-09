import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import type { AnalysisRecord } from '@/types'
import {
  getSourceTypeLabel,
} from '@/lib/sourceTypes'
import {
  formatRelativeDate,
  getClaimStatusLabel,
  getVerdictLabel,
} from '@/lib/format'
import { Button } from '@/components/ui/button'

interface ReportActionsProps {
  record: AnalysisRecord
}

function buildReportText(record: AnalysisRecord): string {
  const { report } = record
  const lines = [
    `Veritas AI — Credibility Report`,
    `Title: ${record.title ?? 'Untitled'}`,
    `Source: ${getSourceTypeLabel(record.sourceType)}`,
    `Date: ${formatRelativeDate(record.createdAt)}`,
    ``,
    `Trust Score: ${report.trustScore}/100`,
    `Verdict: ${getVerdictLabel(report.verdict)}`,
    ``,
    `Summary`,
    report.summary,
    ``,
    `Claims (${report.claims.length})`,
    ...report.claims.map(
      (c, i) =>
        `${i + 1}. [${getClaimStatusLabel(c.status)}] ${c.claim} (${c.confidence}% confidence)`,
    ),
    ``,
    `Explain like I'm 15`,
    report.eli15,
  ]
  return lines.join('\n')
}

export function ReportActions({ record }: ReportActionsProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(buildReportText(record))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({
        title: record.title ?? 'Veritas AI Report',
        text: record.report.summary,
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
        {copied ? (
          <Check className="size-3.5 text-success" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? 'Copied' : 'Copy report'}
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
        <Share2 className="size-3.5" />
        Share
      </Button>
    </div>
  )
}
