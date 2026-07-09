import { useRef, useState } from 'react'
import { ArrowRight, FileUp, X } from 'lucide-react'
import { MAX_CONTENT_LENGTH } from '@/lib/constants'
import { SOURCE_TYPE_OPTIONS } from '@/lib/sourceTypes'
import { cn } from '@/lib/utils'
import type { SourceType } from '@veritas/shared'
import { AnalysisLoading } from '@/components/analysis/AnalysisLoading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAnalyze } from '@/hooks/useAnalyze'
import { ApiClientError } from '@/services/api'

interface AnalysisInputProps {
  className?: string
}

export function AnalysisInput({ className }: AnalysisInputProps) {
  const [content, setContent] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('article')
  const [title, setTitle] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const analyze = useAnalyze()

  const isPdfMode = sourceType === 'pdf'
  const charCount = content.length
  const isOverLimit = charCount > MAX_CONTENT_LENGTH
  const canSubmit = isPdfMode
    ? Boolean(pdfFile) && !analyze.isPending
    : content.trim().length > 0 && !isOverLimit && !analyze.isPending

  function handleSubmit() {
    if (!canSubmit) return

    if (isPdfMode && pdfFile) {
      analyze.mutatePdf({ file: pdfFile, title: title.trim() || undefined })
      return
    }

    analyze.mutate({
      content: content.trim(),
      sourceType,
      title: title.trim() || undefined,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (isPdfMode) return
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleFileSelect(file: File | null) {
    if (!file) {
      setPdfFile(null)
      return
    }
    if (file.type !== 'application/pdf') return
    setPdfFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  if (analyze.isPending) {
    return <AnalysisLoading className={className} />
  }

  return (
    <div
      className={cn('panel-gold overflow-hidden', className)}
      data-onboarding="analysis-input"
    >
      <div className="border-b border-black/10 px-5 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground/55">
          Source type
        </p>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Source type">
          {SOURCE_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={sourceType === option.value}
              onClick={() => {
                setSourceType(option.value)
                if (option.value !== 'pdf') setPdfFile(null)
              }}
              className={cn(
                'border px-3 py-1.5 text-xs transition-all',
                sourceType === option.value
                  ? 'border-black/30 bg-black/10 text-foreground'
                  : 'border-transparent text-foreground/55 hover:border-black/15 hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-black/10 px-5 py-3">
        <Input
          placeholder="Headline or label (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-9 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          aria-label="Analysis title"
        />
      </div>

      {isPdfMode ? (
        <div
          className={cn(
            'mx-5 my-5 flex min-h-[260px] flex-col items-center justify-center border-2 border-dashed px-6 py-10 transition-colors md:min-h-[300px]',
            isDragging
              ? 'border-black/40 bg-black/10'
              : 'border-black/20 bg-black/5',
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            aria-label="Upload PDF file"
          />

          {pdfFile ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <FileUp className="size-8 text-foreground" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">{pdfFile.name}</p>
              <p className="text-xs text-foreground/55">
                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · PDF
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-foreground/70"
                onClick={() => {
                  setPdfFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                <X className="size-3.5" />
                Remove file
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <FileUp className="size-8 text-foreground/50" strokeWidth={1.5} />
              <p className="text-sm text-foreground/75">
                Drag & drop a PDF here, or{' '}
                <button
                  type="button"
                  className="font-medium underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-foreground/45">Max 10 MB · text-based PDFs only</p>
            </div>
          )}
        </div>
      ) : (
        <Textarea
          placeholder="Paste the content you want verified — article, thread, transcript, forward…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[260px] resize-none border-0 bg-transparent px-5 py-5 font-sans text-sm leading-relaxed shadow-none focus-visible:ring-0 md:min-h-[300px] md:text-base"
          aria-label="Content to analyze"
          aria-invalid={isOverLimit}
        />
      )}

      <div className="flex flex-col gap-4 border-t border-black/10 bg-black/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          {!isPdfMode && (
            <p
              className={cn(
                'text-xs tabular-nums',
                isOverLimit ? 'text-danger' : 'text-foreground/55',
              )}
            >
              {charCount.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} characters
            </p>
          )}
          {analyze.isError && (
            <p className="text-xs text-danger" role="alert">
              {analyze.error instanceof ApiClientError
                ? analyze.error.message
                : 'Analysis failed. Please try again.'}
            </p>
          )}
          {!isPdfMode && (
            <p className="hidden text-[11px] text-foreground/45 sm:block">
              ⌘ + Enter to run analysis
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="lg"
          className="h-11 gap-2 bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90"
          data-onboarding="analyze-button"
        >
          Run analysis
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
