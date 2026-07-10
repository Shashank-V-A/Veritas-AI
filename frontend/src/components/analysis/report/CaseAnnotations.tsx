import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, MessageSquarePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Claim } from '@veritas/shared'
import { api } from '@/services/api'
import { getFriendlyErrorMessage } from '@/lib/errorMessages'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface CaseAnnotationsProps {
  analysisId: string
  claims: Claim[]
  readOnly?: boolean
  className?: string
}

export function CaseAnnotations({
  analysisId,
  claims,
  readOnly = false,
  className,
}: CaseAnnotationsProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [claimIndex, setClaimIndex] = useState<number | undefined>(undefined)
  const [appealIndex, setAppealIndex] = useState<number | null>(null)
  const [appealReason, setAppealReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['annotations', analysisId],
    queryFn: () => api.getAnnotations(analysisId),
    enabled: !readOnly,
  })

  const addMutation = useMutation({
    mutationFn: () => api.addAnnotation(analysisId, note.trim(), claimIndex),
    onSuccess: () => {
      setNote('')
      setClaimIndex(undefined)
      void queryClient.invalidateQueries({ queryKey: ['annotations', analysisId] })
    },
  })

  const appealMutation = useMutation({
    mutationFn: ({ index, reason }: { index: number; reason: string }) =>
      api.appealClaim(analysisId, index, reason),
    onSuccess: () => {
      setAppealIndex(null)
      setAppealReason('')
      void queryClient.invalidateQueries({ queryKey: ['annotations', analysisId] })
    },
  })

  const annotations = data?.annotations ?? []

  return (
    <div className={cn('space-y-4', className)}>
      {!readOnly && (
        <div className="space-y-3 border border-accent/15 bg-accent/5 p-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('report.addNote')}
            className="min-h-[80px] resize-none border-accent/20 bg-surface/50 text-sm"
            aria-label={t('report.addNote')}
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={claimIndex ?? ''}
              onChange={(e) =>
                setClaimIndex(e.target.value ? Number(e.target.value) : undefined)
              }
              className="h-9 border border-accent/20 bg-surface/50 px-2 text-xs text-card-foreground"
              aria-label="Link note to claim"
            >
              <option value="">General note</option>
              {claims.map((claim, i) => (
                <option key={i} value={i}>
                  Claim {i + 1}: {claim.claim.slice(0, 48)}…
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={!note.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
              aria-label={t('report.addNote')}
            >
              <MessageSquarePlus className="size-3.5" />
              {t('report.addNote')}
            </Button>
          </div>
          {addMutation.isError && (
            <p className="text-xs text-danger" role="alert">
              {getFriendlyErrorMessage(addMutation.error)}
            </p>
          )}
        </div>
      )}

      {claims.length > 0 && !readOnly && (
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-card-foreground/45">Per-claim appeals</p>
          {claims.map((claim, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-2 border border-accent/10 px-3 py-2"
            >
              <span className="line-clamp-1 text-xs text-card-foreground/70">
                {i + 1}. {claim.claim}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => setAppealIndex(i)}
                aria-label={`${t('report.appeal')} — claim ${i + 1}`}
              >
                <Flag className="size-3" />
                {t('report.appeal')}
              </Button>
            </div>
          ))}
        </div>
      )}

      {appealIndex != null && (
        <div className="border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm text-card-foreground/80">
            Appeal claim {appealIndex + 1}: {claims[appealIndex]?.claim}
          </p>
          <Textarea
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            placeholder="Why should this verdict be reconsidered?"
            className="mt-2 min-h-[60px] resize-none border-accent/20 text-sm"
            aria-label="Appeal reason"
          />
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={appealMutation.isPending}
              onClick={() =>
                appealMutation.mutate({
                  index: appealIndex,
                  reason: appealReason.trim() || 'User disputed claim',
                })
              }
            >
              Submit appeal
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAppealIndex(null)
                setAppealReason('')
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {isLoading && <p className="text-xs text-card-foreground/45">{t('common.loading')}</p>}
        {annotations.length === 0 && !isLoading && (
          <p className="text-xs text-card-foreground/45">No notes yet.</p>
        )}
        {annotations.map((ann) => (
          <article
            key={ann.id}
            className="border-l-2 border-accent-secondary/50 bg-accent/5 px-3 py-2"
          >
            {ann.claimIndex != null && (
              <p className="font-mono text-[10px] text-accent-secondary/80">
                Claim {ann.claimIndex + 1}
              </p>
            )}
            <p className="text-sm text-card-foreground/80">{ann.note}</p>
            <time className="mt-1 block font-mono text-[10px] text-card-foreground/40">
              {new Date(ann.createdAt).toLocaleString()}
            </time>
          </article>
        ))}
      </div>
    </div>
  )
}
