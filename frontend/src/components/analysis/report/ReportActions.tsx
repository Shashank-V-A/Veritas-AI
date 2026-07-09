import { useState } from 'react'
import { Check, Copy, Download, Share2, Trash2 } from 'lucide-react'
import type { AnalysisRecord } from '@veritas/shared'
import { getSourceTypeLabel } from '@/lib/sourceTypes'
import {
  formatRelativeDate,
  getClaimStatusLabel,
  getVerdictLabel,
} from '@/lib/format'
import { Button } from '@/components/ui/button'
import { api, ApiClientError } from '@/services/api'

interface ReportActionsProps {
  record: AnalysisRecord
  onDelete?: () => void
  isDeleting?: boolean
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

export function ReportActions({
  record,
  onDelete,
  isDeleting = false,
}: ReportActionsProps) {
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

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

  async function handleExportPdf() {
    setExporting(true)
    setExportError(null)
    try {
      const blob = await api.exportReportPdf(record.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${(record.title ?? 'veritas-report').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 60)}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setExportError(
        error instanceof ApiClientError ? error.message : 'PDF export failed',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
          {copied ? (
            <Check className="size-3.5 text-success" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? 'Copied' : 'Copy report'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void handleExportPdf()}
          disabled={exporting}
        >
          <Download className="size-3.5" />
          {exporting ? 'Exporting…' : 'Download PDF'}
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
          <Share2 className="size-3.5" />
          Share
        </Button>
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-danger/30 text-danger hover:bg-danger/10 hover:text-danger"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="size-3.5" />
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        )}
      </div>
      {exportError && (
        <p className="text-xs text-danger" role="alert">
          {exportError}
        </p>
      )}
    </div>
  )
}
