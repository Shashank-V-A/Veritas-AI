import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/services/api'
import { getFriendlyErrorMessage } from '@/lib/errorMessages'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ScheduleRecheckButtonProps {
  analysisId: string
  sourceUrl?: string
  className?: string
}

export function ScheduleRecheckButton({
  analysisId,
  sourceUrl,
  className,
}: ScheduleRecheckButtonProps) {
  const { t } = useTranslation()
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSchedule() {
    setLoading(true)
    setError(null)
    try {
      await api.scheduleRecheck({
        analysisId,
        sourceUrl,
        days,
      })
      setDone(true)
    } catch (err) {
      setError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <select
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        className="h-9 border border-accent/20 bg-surface/50 px-2 text-xs text-card-foreground"
        aria-label="Recheck interval in days"
        disabled={done}
      >
        <option value={3}>3 days</option>
        <option value={7}>7 days</option>
        <option value={14}>14 days</option>
        <option value={30}>30 days</option>
      </select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => void handleSchedule()}
        disabled={loading || done}
        aria-label={t('report.scheduleRecheck')}
      >
        <CalendarClock className="size-3.5" />
        {done ? t('report.scheduled') : loading ? t('common.loading') : t('report.scheduleRecheck')}
      </Button>
      {error && (
        <p className="w-full text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
