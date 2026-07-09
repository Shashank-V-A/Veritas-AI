import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { MAX_CONTENT_LENGTH } from '@/lib/constants'
import { SOURCE_TYPE_OPTIONS } from '@/lib/sourceTypes'
import { cn } from '@/lib/utils'
import type { SourceType } from '@/types'
import { AnalysisLoading } from '@/components/analysis/AnalysisLoading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <Card
      className={cn('border-border bg-surface', className)}
      data-onboarding="analysis-input"
    >
      <CardContent className="p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Source type">
            {SOURCE_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={sourceType === option.value}
                onClick={() => setSourceType(option.value)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs transition-colors',
                  sourceType === option.value
                    ? 'bg-surface-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-surface-secondary/60 hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-border px-4 py-3">
          <Input
            placeholder="Optional title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            aria-label="Analysis title"
          />
        </div>

        <Textarea
          placeholder="Paste an article, social post, transcript, or any text you want verified..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[240px] resize-none border-0 bg-transparent px-4 py-4 text-sm leading-relaxed shadow-none focus-visible:ring-0"
          aria-label="Content to analyze"
          aria-invalid={isOverLimit}
        />

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p
              className={cn(
                'text-xs tabular-nums',
                isOverLimit ? 'text-danger' : 'text-muted',
              )}
            >
              {charCount.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
            </p>
            {analyze.isError && (
              <p className="text-xs text-danger" role="alert">
                {analyze.error instanceof ApiClientError
                  ? analyze.error.message
                  : 'Analysis failed. Please try again.'}
              </p>
            )}
            <p className="hidden text-[11px] text-muted sm:block">
              Ctrl+Enter to analyze
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="gap-2 sm:shrink-0"
            data-onboarding="analyze-button"
          >
            <Sparkles className="size-4" />
            Analyze
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
