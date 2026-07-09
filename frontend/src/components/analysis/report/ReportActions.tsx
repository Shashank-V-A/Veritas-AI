import { useState } from 'react'
import { Check, Download, FileText, Printer, RefreshCw, Share2, Trash2 } from 'lucide-react'
import type { AnalysisRecord } from '@veritas/shared'
import { getFriendlyErrorMessage } from '@/lib/errorMessages'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'

interface ReportActionsProps {
  record: AnalysisRecord
  onDelete?: () => void
  isDeleting?: boolean
  onReanalyze?: () => void
  isReanalyzing?: boolean
  readOnly?: boolean
}

export function ReportActions({
  record,
  onDelete,
  isDeleting = false,
  onReanalyze,
  isReanalyzing = false,
  readOnly = false,
}: ReportActionsProps) {
  const [shareCopied, setShareCopied] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingMd, setExportingMd] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)

  async function handleShare() {
    setSharing(true)
    setShareError(null)
    try {
      const { shareUrl } = await api.shareReport(record.id)
      const fullUrl = shareUrl.startsWith('http')
        ? shareUrl
        : `${window.location.origin}${shareUrl.startsWith('/') ? shareUrl : ROUTES.share(shareUrl)}`
      await navigator.clipboard.writeText(fullUrl)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2500)
    } catch (error) {
      setShareError(getFriendlyErrorMessage(error))
    } finally {
      setSharing(false)
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true)
    setExportError(null)
    try {
      const blob = await api.exportReportPdf(record.id)
      downloadBlob(blob, `${safeFilename(record.title)}.pdf`)
    } catch (error) {
      setExportError(getFriendlyErrorMessage(error))
    } finally {
      setExportingPdf(false)
    }
  }

  async function handleExportMarkdown() {
    setExportingMd(true)
    setExportError(null)
    try {
      const blob = await api.exportReportMarkdown(record.id)
      downloadBlob(blob, `${safeFilename(record.title)}.md`)
    } catch (error) {
      setExportError(getFriendlyErrorMessage(error))
    } finally {
      setExportingMd(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex flex-col items-end gap-2 print:hidden">
      <div className="flex flex-wrap justify-end gap-2">
        {!readOnly && onReanalyze && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onReanalyze}
            disabled={isReanalyzing}
          >
            <RefreshCw className={cnSpin(isReanalyzing)} />
            {isReanalyzing ? 'Re-analyzing…' : 'Re-analyze'}
          </Button>
        )}
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handleShare()}
            disabled={sharing}
          >
            {shareCopied ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Share2 className="size-3.5" />
            )}
            {shareCopied ? 'Link copied' : sharing ? 'Sharing…' : 'Share'}
          </Button>
        )}
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handleExportMarkdown()}
            disabled={exportingMd}
          >
            <FileText className="size-3.5" />
            {exportingMd ? 'Exporting…' : 'Markdown'}
          </Button>
        )}
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handleExportPdf()}
            disabled={exportingPdf}
          >
            <Download className="size-3.5" />
            {exportingPdf ? 'Exporting…' : 'PDF'}
          </Button>
        )}
        <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
          <Printer className="size-3.5" />
          Print
        </Button>
        {!readOnly && onDelete && (
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
      {(exportError || shareError) && (
        <p className="text-xs text-danger" role="alert">
          {exportError ?? shareError}
        </p>
      )}
    </div>
  )
}

function safeFilename(title?: string): string {
  return (title ?? 'veritas-report').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 60)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function cnSpin(active: boolean): string {
  return active ? 'size-3.5 animate-spin' : 'size-3.5'
}
