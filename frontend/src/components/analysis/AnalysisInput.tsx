import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, FileUp, Globe, Link2, SlidersHorizontal, X } from 'lucide-react'
import { MAX_CONTENT_LENGTH, FOCUS_INTAKE_EVENT } from '@/lib/constants'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { generateIntakeCaseRef } from '@/lib/caseId'
import { getFriendlyErrorMessage } from '@/lib/errorMessages'
import { SOURCE_TYPE_OPTIONS } from '@/lib/sourceTypes'
import { cn } from '@/lib/utils'
import type { AnalysisCategory, SourceType } from '@veritas/shared'
import { AnalysisLoading } from '@/components/analysis/AnalysisLoading'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAnalyze } from '@/hooks/useAnalyze'
import type { AnalysisPrefill } from '@/lib/sampleReport'

type InputMode = 'text' | 'url'

interface AnalysisInputProps {
  className?: string
  prefill?: AnalysisPrefill | null
  onPrefillConsumed?: () => void
  id?: string
}

export function AnalysisInput({
  className,
  prefill,
  onPrefillConsumed,
  id = 'analysis-intake',
}: AnalysisInputProps) {
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('article')
  const [category, setCategory] = useState<AnalysisCategory>('news')
  const [title, setTitle] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [compareContent, setCompareContent] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mobileTypesOpen, setMobileTypesOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const analyze = useAnalyze()
  const caseRef = useMemo(() => generateIntakeCaseRef(), [])

  useEffect(() => {
    if (!prefill) return
    setInputMode('text')
    setContent(prefill.content)
    setSourceType(prefill.sourceType)
    setTitle(prefill.title ?? '')
    setPdfFile(null)
    onPrefillConsumed?.()
  }, [prefill, onPrefillConsumed])

  useEffect(() => {
    function handleFocusIntake() {
      inputRef.current?.focus()
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    window.addEventListener(FOCUS_INTAKE_EVENT, handleFocusIntake)
    return () => window.removeEventListener(FOCUS_INTAKE_EVENT, handleFocusIntake)
  }, [id])

  const isPdfMode = sourceType === 'pdf' && inputMode === 'text'
  const isUrlMode = inputMode === 'url'
  const charCount = content.length
  const isOverLimit = charCount > MAX_CONTENT_LENGTH
  const canSubmit = isUrlMode
    ? url.trim().length > 0 && !analyze.isPending
    : isPdfMode
      ? Boolean(pdfFile) && !analyze.isPending
      : content.trim().length > 0 && !isOverLimit && !analyze.isPending

  function handleSubmit() {
    if (!canSubmit) return

    const shared = {
      title: title.trim() || undefined,
      category,
      compareContent: compareMode && compareContent.trim() ? compareContent.trim() : undefined,
    }

    if (isUrlMode) {
      analyze.mutateUrl({ url: url.trim(), ...shared })
      return
    }

    if (isPdfMode && pdfFile) {
      analyze.mutatePdf({ file: pdfFile, title: shared.title })
      return
    }

    analyze.mutate({
      content: content.trim(),
      sourceType,
      ...shared,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (isPdfMode || isUrlMode) return
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

  function renderSourceTypeTabs(compact = false) {
    return SOURCE_TYPE_OPTIONS.map((option) => {
      const Icon = option.icon
      const isActive = sourceType === option.value
      return (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => {
            setSourceType(option.value)
            if (option.value !== 'pdf') setPdfFile(null)
            if (compact) setMobileTypesOpen(false)
          }}
          className={cn(
            'flex items-center gap-2 border px-2.5 py-2 text-left text-xs transition-all',
            compact ? 'w-full' : '',
            isActive
              ? 'evidence-tab-active'
              : 'border-transparent text-card-foreground/55 hover:border-accent/20 hover:text-card-foreground',
          )}
        >
          <Icon className="size-3.5 shrink-0" strokeWidth={1.5} />
          <span>{option.label}</span>
        </button>
      )
    })
  }

  if (analyze.isPending) {
    return <AnalysisLoading className={className} />
  }

  return (
    <div
      id={id}
      className={cn('case-intake-panel grain relative overflow-hidden', className)}
      data-onboarding="analysis-input"
    >
      <div className="relative z-10 grid lg:grid-cols-[13.5rem_1fr]">
        <aside className="hidden border-b border-accent/15 p-4 lg:block lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] text-card-foreground/45">Evidence type</p>
          <div
            className="mt-3 flex flex-col gap-1"
            role="tablist"
            aria-label="Source type"
          >
            {renderSourceTypeTabs()}
          </div>

          {!isPdfMode && !isUrlMode && (
            <div className="mt-6 border-t border-accent/10 pt-4">
              <p className="font-mono text-[10px] text-card-foreground/45">Character count</p>
              <p
                className={cn(
                  'mt-1 font-mono text-sm tabular-nums',
                  isOverLimit ? 'text-danger' : 'text-card-foreground/70',
                )}
              >
                {charCount.toLocaleString()}
                <span className="text-card-foreground/40">
                  {' '}
                  / {MAX_CONTENT_LENGTH.toLocaleString()}
                </span>
              </p>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="border-b border-accent/15 px-5 py-4 md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] text-accent-secondary/80">
                  Case intake · {caseRef}
                </p>
                <p className="mt-1 font-mono text-xs text-card-foreground/55">
                  Status · Pending submission
                </p>
              </div>
              <span className="stamp border-accent-secondary text-accent-secondary">Intake</span>
            </div>
            <div className="accent-line-on-dark mt-4 w-24" />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-accent/10 px-5 py-3 md:px-6">
            <div className="flex gap-1" role="tablist" aria-label="Input mode">
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'text'}
                onClick={() => setInputMode('text')}
                className={cn(
                  'flex items-center gap-1.5 border px-2.5 py-1.5 text-xs transition-colors',
                  inputMode === 'text'
                    ? 'border-accent/40 bg-accent/10 text-card-foreground'
                    : 'border-transparent text-card-foreground/55',
                )}
              >
                <FileUp className="size-3.5" />
                Paste text
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'url'}
                onClick={() => setInputMode('url')}
                className={cn(
                  'flex items-center gap-1.5 border px-2.5 py-1.5 text-xs transition-colors',
                  inputMode === 'url'
                    ? 'border-accent/40 bg-accent/10 text-card-foreground'
                    : 'border-transparent text-card-foreground/55',
                )}
              >
                <Globe className="size-3.5" />
                URL
              </button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto gap-1.5 text-xs text-card-foreground/70 lg:hidden"
              onClick={() => setMobileTypesOpen(true)}
            >
              <SlidersHorizontal className="size-3.5" />
              {SOURCE_TYPE_OPTIONS.find((o) => o.value === sourceType)?.label}
            </Button>
          </div>

          <div className="grid gap-3 border-b border-accent/10 px-5 py-3 sm:grid-cols-2 md:px-6">
            <Input
              placeholder="Headline or label (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 border-0 bg-transparent px-0 text-sm text-card-foreground shadow-none placeholder:text-card-foreground/35 focus-visible:ring-0"
              aria-label="Analysis title"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AnalysisCategory)}
              className="h-9 border-0 bg-transparent text-sm text-card-foreground focus:outline-none"
              aria-label="Content category"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface text-card-foreground">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 border-b border-accent/10 px-5 py-2 md:px-6">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-card-foreground/70">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="size-3.5 accent-accent"
              />
              Compare mode — add rebuttal or alternate source
            </label>
          </div>

          {compareMode && (
            <div className="border-b border-accent/10 px-5 py-3 md:px-6">
              <Textarea
                placeholder="Paste rebuttal, fact-check, or alternate source for side-by-side comparison…"
                value={compareContent}
                onChange={(e) => setCompareContent(e.target.value)}
                className="min-h-[100px] resize-none border border-accent/20 bg-accent/5 text-sm text-card-foreground placeholder:text-card-foreground/35"
                aria-label="Compare content"
              />
            </div>
          )}

          {sourceType === 'forward' && inputMode === 'text' && (
            <p className="border-b border-accent/10 px-5 py-2 text-xs text-card-foreground/55 md:px-6">
              Forwards often mix urgency, ALL CAPS, and unverified claims. Paste the full message
              including any attribution chain for best results.
            </p>
          )}

          {isUrlMode ? (
            <div className="px-5 py-5 md:px-6">
              <div className="flex items-center gap-2 border border-accent/20 bg-accent/5 px-3 py-2">
                <Link2 className="size-4 shrink-0 text-card-foreground/50" />
                <Input
                  placeholder="https://example.com/article…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                  aria-label="URL to analyze"
                />
              </div>
              <p className="mt-2 text-xs text-card-foreground/45">
                Veritas will fetch and analyze the page content.
              </p>
            </div>
          ) : isPdfMode ? (
            <div
              className={cn(
                'mx-5 my-5 flex min-h-[240px] flex-col items-center justify-center border-2 border-dashed px-6 py-10 transition-colors md:mx-6 md:min-h-[280px]',
                isDragging
                  ? 'border-accent-secondary/50 bg-accent/10'
                  : 'border-accent/25 bg-accent/5',
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
                  <FileUp className="size-8 text-card-foreground" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-card-foreground">{pdfFile.name}</p>
                  <p className="text-xs text-card-foreground/55">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · PDF
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-card-foreground/70"
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
                  <FileUp className="size-8 text-card-foreground/50" strokeWidth={1.5} />
                  <p className="text-sm text-card-foreground/75">
                    Drag & drop a PDF here, or{' '}
                    <button
                      type="button"
                      className="font-medium text-accent-secondary underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse files
                    </button>
                  </p>
                  <p className="text-xs text-card-foreground/45">Max 10 MB · text-based PDFs only</p>
                </div>
              )}
            </div>
          ) : (
            <Textarea
              ref={inputRef}
              placeholder="Paste the content under investigation — article, thread, transcript, forward…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="legal-pad min-h-[240px] resize-none border-0 bg-transparent px-5 py-5 font-sans text-sm leading-[1.75rem] text-card-foreground shadow-none placeholder:text-card-foreground/35 focus-visible:ring-0 md:min-h-[280px] md:px-6 md:text-base"
              aria-label="Content to analyze"
              aria-invalid={isOverLimit}
            />
          )}

          <div className="mt-auto flex flex-col gap-4 border-t border-accent/15 bg-accent/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div className="flex flex-col gap-1">
              {!isPdfMode && !isUrlMode && (
                <p
                  className={cn(
                    'text-xs tabular-nums lg:hidden',
                    isOverLimit ? 'text-danger' : 'text-card-foreground/55',
                  )}
                >
                  {charCount.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} characters
                </p>
              )}
              {analyze.isError && (
                <p className="text-xs text-danger" role="alert">
                  {getFriendlyErrorMessage(analyze.error)}
                </p>
              )}
              {!isPdfMode && !isUrlMode && (
                <p className="hidden text-[11px] text-card-foreground/45 sm:block">
                  ⌘ + Enter to file for analysis
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
              File for analysis
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={mobileTypesOpen} onOpenChange={setMobileTypesOpen}>
        <DialogContent className="fixed bottom-0 top-auto max-h-[70vh] w-full max-w-none translate-y-0 rounded-b-none rounded-t-xl sm:max-w-lg sm:rounded-xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
          <DialogHeader>
            <DialogTitle>Evidence type</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1" role="tablist">
            {renderSourceTypeTabs(true)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
