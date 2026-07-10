import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FileUp, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getFriendlyErrorMessage } from '@/lib/errorMessages'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

interface QueuedFile {
  id: string
  file: File
  title: string
  status: 'queued' | 'processing' | 'done' | 'error'
  error?: string
}

const STATUS_KEYS = {
  queued: 'dashboard.statusQueued',
  processing: 'dashboard.statusProcessing',
  done: 'dashboard.statusDone',
  error: 'dashboard.statusError',
} as const

export function BatchIntake({ className }: { className?: string }) {
  const { t } = useTranslation()
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return

    const newItems: QueuedFile[] = Array.from(files)
      .filter((f) => f.type === 'application/pdf')
      .map((file) => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        title: file.name.replace(/\.pdf$/i, ''),
        status: 'queued' as const,
      }))

    setQueue((prev) => [...prev, ...newItems])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function processQueue() {
    if (isProcessing || queue.every((q) => q.status !== 'queued')) return

    setIsProcessing(true)
    const pending = queue.filter((q) => q.status === 'queued')

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'processing' } : q)),
      )

      try {
        await api.analyzePdf(item.file, item.title)
        void queryClient.invalidateQueries({ queryKey: ['history'] })
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'done' } : q)),
        )
      } catch (error) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', error: getFriendlyErrorMessage(error) }
              : q,
          ),
        )
      }
    }

    setIsProcessing(false)
  }

  function removeItem(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id))
  }

  const queuedCount = queue.filter((q) => q.status === 'queued').length

  return (
    <div className={cn('dossier-panel p-4 md:p-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] text-card-foreground/45">
            {t('dashboard.batchTitle')}
          </p>
          <p className="mt-1 text-sm text-card-foreground/75">
            {t('dashboard.batchBody')}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="size-3.5" />
            {t('dashboard.addPdfs')}
          </Button>
          {queuedCount > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => void processQueue()}
              disabled={isProcessing}
            >
              {isProcessing
                ? t('dashboard.processing')
                : t('dashboard.processCount', { count: queuedCount })}
            </Button>
          )}
        </div>
      </div>

      {queue.length > 0 && (
        <ul className="mt-4 space-y-2">
          {queue.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 border border-accent/15 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-card-foreground">{item.file.name}</p>
                <p className="font-mono text-[10px] text-card-foreground/45">
                  {t(STATUS_KEYS[item.status])}
                  {item.error ? ` · ${item.error}` : ''}
                </p>
              </div>
              {item.status === 'queued' && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-card-foreground/40 hover:text-card-foreground"
                  aria-label={t('dashboard.removeFromQueue')}
                >
                  <X className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
