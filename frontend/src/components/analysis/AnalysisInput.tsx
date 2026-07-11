import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  FileText,
  FileUp,
  Globe,
  ImageIcon,
  Link2,
  Type,
  Video,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MAX_CONTENT_LENGTH, FOCUS_INTAKE_EVENT } from '@/lib/constants'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { getFriendlyErrorMessage } from '@/lib/errorMessages'
import { SOURCE_TYPE_OPTIONS } from '@/lib/sourceTypes'
import { cn } from '@/lib/utils'
import type { AnalysisCategory, SourceType } from '@veritas/shared'
import { AnalysisLoading } from '@/components/analysis/AnalysisLoading'
import { ForwardRiskBadge } from '@/components/analysis/ForwardRiskBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAnalyze } from '@/hooks/useAnalyze'
import type { AnalysisPrefill } from '@/lib/sampleReport'

type InputMode = 'text' | 'url' | 'youtube' | 'image' | 'pdf'

const MODES: {
  id: InputMode
  labelKey: string
  hintKey: string
  icon: typeof Type
}[] = [
  {
    id: 'text',
    labelKey: 'intake.pasteText',
    hintKey: 'intake.hintText',
    icon: Type,
  },
  {
    id: 'url',
    labelKey: 'intake.webLink',
    hintKey: 'intake.hintUrl',
    icon: Globe,
  },
  {
    id: 'youtube',
    labelKey: 'intake.youtube',
    hintKey: 'intake.hintYoutube',
    icon: Video,
  },
  {
    id: 'image',
    labelKey: 'intake.image',
    hintKey: 'intake.hintImage',
    icon: ImageIcon,
  },
  {
    id: 'pdf',
    labelKey: 'intake.pdf',
    hintKey: 'intake.hintPdf',
    icon: FileText,
  },
]

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
  const { t } = useTranslation()
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('article')
  const [category, setCategory] = useState<AnalysisCategory>('news')
  const [title, setTitle] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const analyze = useAnalyze()

  useEffect(() => {
    if (!prefill) return
    if (prefill.url) {
      setInputMode('url')
      setUrl(prefill.url)
    } else {
      setInputMode('text')
      setContent(prefill.content)
    }
    setSourceType(prefill.sourceType)
    setTitle(prefill.title ?? '')
    setPdfFile(null)
    setImageFile(null)
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

  const charCount = content.length
  const isOverLimit = charCount > MAX_CONTENT_LENGTH

  const canSubmit =
    inputMode === 'youtube'
      ? youtubeUrl.trim().length > 0 && !analyze.isPending
      : inputMode === 'image'
        ? Boolean(imageFile) && !analyze.isPending
        : inputMode === 'url'
          ? url.trim().length > 0 && !analyze.isPending
          : inputMode === 'pdf'
            ? Boolean(pdfFile) && !analyze.isPending
            : content.trim().length > 0 && !isOverLimit && !analyze.isPending

  function switchMode(mode: InputMode) {
    setInputMode(mode)
    if (mode === 'pdf') setSourceType('pdf')
    else if (mode === 'url') setSourceType('article')
    else if (mode === 'youtube') setSourceType('transcript')
    else if (mode === 'image') setSourceType('social')
  }

  function handleSubmit() {
    if (!canSubmit) return

    const shared = {
      title: title.trim() || undefined,
      category,
    }

    if (inputMode === 'youtube') {
      analyze.mutateYoutube({
        url: youtubeUrl.trim(),
        title: shared.title,
        category: shared.category,
      })
      return
    }

    if (inputMode === 'image' && imageFile) {
      analyze.mutateImage({ file: imageFile, title: shared.title })
      return
    }

    if (inputMode === 'url') {
      analyze.mutateUrl({ url: url.trim(), ...shared })
      return
    }

    if (inputMode === 'pdf' && pdfFile) {
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
    if (inputMode !== 'text') return
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

  function handleImageSelect(file: File | null) {
    if (!file) {
      setImageFile(null)
      return
    }
    if (!file.type.startsWith('image/')) return
    if (file.size > 4 * 1024 * 1024) {
      window.alert(t('intake.imageTooLarge'))
      return
    }
    setImageFile(file)
  }

  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageSelect(file)
  }

  if (analyze.isPending) {
    return <AnalysisLoading className={className} />
  }

  const activeMode = MODES.find((m) => m.id === inputMode)!

  return (
    <div
      id={id}
      className={cn('case-intake-panel relative overflow-hidden', className)}
      data-onboarding="analysis-input"
    >
      <div className="relative z-10 p-5 md:p-6">
        {/* Step 1 — how to submit */}
        <div>
          <h2 className="font-display text-xl text-foreground md:text-2xl">
            {t('intake.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('intake.subtitle')}
          </p>
        </div>

        <div
          className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
          role="tablist"
          aria-label={t('intake.howToSubmit')}
        >
          {MODES.map(({ id: modeId, labelKey, hintKey, icon: Icon }) => {
            const selected = inputMode === modeId
            return (
              <button
                key={modeId}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => switchMode(modeId)}
                className={cn(
                  'flex flex-col items-start gap-1.5 rounded-sm border px-3 py-3 text-left transition-colors',
                  selected
                    ? 'border-accent/50 bg-accent/10 text-foreground'
                    : 'border-border bg-elevated/40 text-muted-foreground hover:border-accent/30 hover:text-foreground',
                )}
              >
                <Icon
                  className={cn('size-4', selected ? 'text-accent' : 'text-muted-foreground')}
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-foreground">{t(labelKey)}</span>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  {t(hintKey)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Step 2 — content */}
        <div className="mt-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-foreground">{t(activeMode.labelKey)}</p>
            <p className="text-xs text-muted-foreground">{t(activeMode.hintKey)}</p>
          </div>

          {inputMode === 'youtube' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-sm border border-border bg-elevated/50 px-3 py-2.5">
                <Video className="size-4 shrink-0 text-accent" strokeWidth={1.5} />
                <Input
                  placeholder={t('intake.youtubePlaceholder')}
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                  aria-label={t('intake.youtubeAria')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('intake.youtubeHelp')}
              </p>
            </div>
          )}

          {inputMode === 'url' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-sm border border-border bg-elevated/50 px-3 py-2.5">
                <Link2 className="size-4 shrink-0 text-accent" strokeWidth={1.5} />
                <Input
                  placeholder={t('intake.urlPlaceholder')}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                  aria-label={t('intake.urlAria')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('intake.urlHelp')}
              </p>
            </div>
          )}

          {inputMode === 'image' && (
            <DropZone
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              onDrop={handleImageDrop}
              inputRef={imageInputRef}
              accept="image/*"
              onSelect={handleImageSelect}
              file={imageFile}
              onClear={() => {
                setImageFile(null)
                if (imageInputRef.current) imageInputRef.current.value = ''
              }}
              icon={ImageIcon}
              emptyLabel={t('intake.dropImage')}
              emptyHint={t('intake.dropImageHint')}
              fileKind={t('intake.image')}
              browseLabel={t('intake.browse')}
              removeLabel={t('intake.remove')}
              uploadAria={t('intake.uploadAria', { kind: t('intake.image') })}
            />
          )}

          {inputMode === 'pdf' && (
            <DropZone
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              onDrop={handleDrop}
              inputRef={fileInputRef}
              accept="application/pdf"
              onSelect={handleFileSelect}
              file={pdfFile}
              onClear={() => {
                setPdfFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              icon={FileUp}
              emptyLabel={t('intake.dropPdf')}
              emptyHint={t('intake.dropPdfHint')}
              fileKind={t('intake.pdf')}
              browseLabel={t('intake.browse')}
              removeLabel={t('intake.remove')}
              uploadAria={t('intake.uploadAria', { kind: t('intake.pdf') })}
            />
          )}

          {inputMode === 'text' && (
            <div className="space-y-3">
              <Textarea
                ref={inputRef}
                placeholder={t('intake.textPlaceholder')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[160px] resize-y rounded-sm border border-border bg-elevated/40 px-4 py-3 text-sm leading-relaxed text-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-accent/40 md:min-h-[180px]"
                aria-label={t('intake.contentAria')}
                aria-invalid={isOverLimit}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">{t('intake.thisIsA')}</span>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as SourceType)}
                    className="h-8 rounded-sm border border-border bg-elevated px-2 text-xs text-foreground"
                    aria-label={t('intake.evidenceType')}
                  >
                    {SOURCE_TYPE_OPTIONS.filter((o) => o.value !== 'pdf').map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </option>
                    ))}
                  </select>
                </label>
                <p
                  className={cn(
                    'font-mono text-[11px] tabular-nums',
                    isOverLimit ? 'text-danger' : 'text-muted-foreground',
                  )}
                >
                  {charCount.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
                </p>
              </div>
              {sourceType === 'forward' && (
                <p className="text-xs text-muted-foreground">
                  {t('intake.forwardTip')}
                </p>
              )}
              {content.trim().length >= 40 && <ForwardRiskBadge content={content} />}
            </div>
          )}
        </div>

        {/* Optional details — collapsed */}
        <div className="mt-5 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            className="flex w-full items-center gap-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={showOptions}
          >
            <ChevronDown
              className={cn('size-3.5 transition-transform', showOptions && 'rotate-180')}
              strokeWidth={1.75}
            />
            {t('intake.optionalDetails')}
            <span className="text-muted-foreground/60">{t('intake.optionalDetailsHint')}</span>
          </button>

          {showOptions && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={t('intake.headline')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 border-border bg-elevated/50 text-sm"
                aria-label={t('intake.analysisTitle')}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AnalysisCategory)}
                className="h-9 rounded-sm border border-border bg-elevated/50 px-3 text-sm text-foreground"
                aria-label={t('intake.contentCategory')}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-[1.25rem]">
            {analyze.isError && (
              <p className="text-xs text-danger" role="alert">
                {getFriendlyErrorMessage(analyze.error)}
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="lg"
            className="h-11 gap-2 bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90"
            data-onboarding="analyze-button"
            aria-label={t('intake.fileForAnalysis')}
          >
            {t('intake.fileForAnalysis')}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function DropZone({
  isDragging,
  setIsDragging,
  onDrop,
  inputRef,
  accept,
  onSelect,
  file,
  onClear,
  icon: Icon,
  emptyLabel,
  emptyHint,
  fileKind,
  browseLabel,
  removeLabel,
  uploadAria,
}: {
  isDragging: boolean
  setIsDragging: (v: boolean) => void
  onDrop: (e: React.DragEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  accept: string
  onSelect: (file: File | null) => void
  file: File | null
  onClear: () => void
  icon: typeof FileUp
  emptyLabel: string
  emptyHint: string
  fileKind: string
  browseLabel: string
  removeLabel: string
  uploadAria: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-[160px] flex-col items-center justify-center rounded-sm border-2 border-dashed px-6 py-8 transition-colors',
        isDragging
          ? 'border-accent/50 bg-accent/10'
          : 'border-border bg-elevated/40',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        aria-label={uploadAria}
      />

      {file ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <Icon className="size-7 text-foreground" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB · {fileKind}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={onClear}
          >
            <X className="size-3.5" />
            {removeLabel}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <Icon className="size-7 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            {emptyLabel}{' '}
            <button
              type="button"
              className="font-medium text-accent underline"
              onClick={() => inputRef.current?.click()}
            >
              {browseLabel}
            </button>
          </p>
          <p className="text-xs text-muted-foreground">{emptyHint}</p>
        </div>
      )}
    </div>
  )
}
