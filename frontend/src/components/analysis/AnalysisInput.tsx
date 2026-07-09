import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { MAX_CONTENT_LENGTH } from '@/lib/constants'
import { SOURCE_TYPE_OPTIONS } from '@/lib/sourceTypes'
import { cn } from '@/lib/utils'
import type { SourceType } from '@/types'
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
  const analyze = useAnalyze()

  const charCount = content.length
  const isOverLimit = charCount > MAX_CONTENT_LENGTH
  const canSubmit = content.trim().length > 0 && !isOverLimit && !analyze.isPending

  function handleSubmit() {
    if (!canSubmit) return

    analyze.mutate({
      content: content.trim(),
      sourceType,
      title: title.trim() || undefined,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
      e.preventDefault()
      handleSubmit()
    }
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
              onClick={() => setSourceType(option.value)}
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

      <Textarea
        placeholder="Paste the content you want verified — article, thread, transcript, forward…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[260px] resize-none border-0 bg-transparent px-5 py-5 font-sans text-sm leading-relaxed shadow-none focus-visible:ring-0 md:min-h-[300px] md:text-base"
        aria-label="Content to analyze"
        aria-invalid={isOverLimit}
      />

      <div className="flex flex-col gap-4 border-t border-black/10 bg-black/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p
            className={cn(
              'text-xs tabular-nums',
              isOverLimit ? 'text-danger' : 'text-foreground/55',
            )}
          >
            {charCount.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} characters
          </p>
          {analyze.isError && (
            <p className="text-xs text-danger" role="alert">
              {analyze.error instanceof ApiClientError
                ? analyze.error.message
                : 'Analysis failed. Please try again.'}
            </p>
          )}
          <p className="hidden text-[11px] text-foreground/45 sm:block">
            ⌘ + Enter to run analysis
          </p>
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
