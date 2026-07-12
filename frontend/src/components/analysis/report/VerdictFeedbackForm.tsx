import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Verdict } from '@veritas/shared'

const SUGGESTIONS: Verdict[] = [
  'credible',
  'mixed',
  'misleading',
  'unsupported',
]

interface VerdictFeedbackFormProps {
  analysisId: string
  currentVerdict: Verdict
}

export function VerdictFeedbackForm({
  analysisId,
  currentVerdict,
}: VerdictFeedbackFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [suggested, setSuggested] = useState<string>('')

  const { data } = useQuery({
    queryKey: ['verdict-feedback', analysisId],
    queryFn: () => api.getVerdictFeedback(analysisId),
  })

  const submit = useMutation({
    mutationFn: () =>
      api.submitVerdictFeedback(analysisId, {
        reason: reason.trim() || undefined,
        suggestedVerdict: suggested || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verdict-feedback', analysisId] })
      setOpen(false)
    },
  })

  if (data?.feedback) {
    return (
      <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <Flag className="size-3.5 text-accent" />
        {t('feedback.recorded')}
      </p>
    )
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Flag className="size-3.5" />
        {t('feedback.open')}
      </Button>
    )
  }

  return (
    <div className="space-y-3 border border-border bg-elevated/40 p-3">
      <p className="text-sm text-foreground">{t('feedback.title')}</p>
      <p className="font-mono text-[10px] text-muted-foreground">
        {t('feedback.current')}: {currentVerdict}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.filter((v) => v !== currentVerdict).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setSuggested(v)}
            className={
              suggested === v
                ? 'border border-accent bg-accent/10 px-2 py-1 font-mono text-[10px] text-accent'
                : 'border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground'
            }
          >
            {v}
          </button>
        ))}
      </div>
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t('feedback.reasonPlaceholder')}
        rows={3}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => submit.mutate()}
          disabled={submit.isPending}
        >
          {t('feedback.submit')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {t('feedback.cancel')}
        </Button>
      </div>
    </div>
  )
}
