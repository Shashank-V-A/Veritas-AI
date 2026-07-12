import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Link2, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface EvidenceLockerProps {
  analysisId: string
  readOnly?: boolean
}

export function EvidenceLocker({ analysisId, readOnly }: EvidenceLockerProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [type, setType] = useState<'url' | 'note' | 'screenshot'>('url')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['exhibits', analysisId],
    queryFn: () => api.getExhibits(analysisId),
    enabled: Boolean(analysisId),
  })

  const add = useMutation({
    mutationFn: () =>
      api.addExhibit(analysisId, {
        type,
        title: title.trim() || undefined,
        url: url.trim() || undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibits', analysisId] })
      setTitle('')
      setUrl('')
      setNote('')
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteExhibit(analysisId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exhibits', analysisId] }),
  })

  const exhibits = data?.exhibits ?? []

  return (
    <div className="space-y-4">
      {isLoading && (
        <p className="font-mono text-xs text-muted-foreground">{t('evidence.loading')}</p>
      )}

      <ul className="space-y-2">
        {exhibits.map((ex) => (
          <li
            key={ex.id}
            className="flex items-start gap-3 border border-border bg-elevated/40 px-3 py-2"
          >
            {ex.type === 'url' ? (
              <Link2 className="mt-0.5 size-4 shrink-0 text-accent" />
            ) : (
              <FileText className="mt-0.5 size-4 shrink-0 text-accent" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {ex.type}
                {ex.title ? ` · ${ex.title}` : ''}
              </p>
              {ex.url && (
                <a
                  href={ex.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 block truncate text-sm text-accent hover:underline"
                >
                  {ex.url}
                </a>
              )}
              {ex.note && (
                <p className="mt-1 text-sm text-muted-foreground">{ex.note}</p>
              )}
            </div>
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => remove.mutate(ex.id)}
                aria-label={t('evidence.remove')}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <form
          className="space-y-3 border border-dashed border-border p-3"
          onSubmit={(e) => {
            e.preventDefault()
            add.mutate()
          }}
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
            {t('evidence.add')}
          </p>
          <div className="flex flex-wrap gap-2">
            {(['url', 'note', 'screenshot'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setType(opt)}
                className={
                  type === opt
                    ? 'border border-accent bg-accent/10 px-2 py-1 font-mono text-[10px] uppercase text-accent'
                    : 'border border-border px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground'
                }
              >
                {t(`evidence.type.${opt}`)}
              </button>
            ))}
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('evidence.titlePlaceholder')}
          />
          {(type === 'url' || type === 'screenshot') && (
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('evidence.urlPlaceholder')}
            />
          )}
          {(type === 'note' || type === 'screenshot') && (
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('evidence.notePlaceholder')}
              rows={3}
            />
          )}
          <Button type="submit" size="sm" className="gap-1.5" disabled={add.isPending}>
            <Plus className="size-3.5" />
            {t('evidence.save')}
          </Button>
        </form>
      )}
    </div>
  )
}
