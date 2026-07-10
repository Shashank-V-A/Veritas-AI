import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/hooks/useDebounce'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

interface ForwardRiskBadgeProps {
  content: string
  className?: string
  minLength?: number
}

export function ForwardRiskBadge({
  content,
  className,
  minLength = 40,
}: ForwardRiskBadgeProps) {
  const { t } = useTranslation()
  const debounced = useDebounce(content.trim(), 500)
  const [score, setScore] = useState<number | null>(null)
  const [signals, setSignals] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (debounced.length < minLength) {
      setScore(null)
      setSignals([])
      return
    }

    let cancelled = false
    setLoading(true)

    void api
      .forwardCheck(debounced)
      .then((result) => {
        if (cancelled) return
        setScore(result.score)
        setSignals(result.signals)
      })
      .catch(() => {
        if (!cancelled) {
          setScore(null)
          setSignals([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debounced, minLength])

  if (debounced.length < minLength) return null

  const riskLevel =
    score == null ? 'unknown' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low'

  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-3 border border-accent/20 bg-accent/5 px-3 py-2',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={t('intake.forwardRisk')}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle
          className={cn(
            'size-4 shrink-0',
            riskLevel === 'high' && 'text-danger',
            riskLevel === 'medium' && 'text-warning',
            riskLevel === 'low' && 'text-success',
            riskLevel === 'unknown' && 'text-card-foreground/40',
          )}
          strokeWidth={1.5}
        />
        <div>
          <p className="font-mono text-[10px] text-card-foreground/50">
            {t('intake.forwardRisk')}
          </p>
          <p className="text-sm font-medium tabular-nums text-card-foreground">
            {loading ? '…' : score != null ? `${score}/100` : '—'}
          </p>
        </div>
      </div>

      {signals.length > 0 && (
        <ul className="flex flex-1 flex-wrap gap-1.5">
          {signals.slice(0, 5).map((signal) => (
            <li
              key={signal}
              className="border border-accent/25 bg-surface/40 px-2 py-0.5 font-mono text-[10px] text-card-foreground/70"
            >
              {signal}
            </li>
          ))}
          {signals.length > 5 && (
            <li className="px-1 font-mono text-[10px] text-card-foreground/45">
              +{signals.length - 5} more
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
