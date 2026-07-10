import { useQuery } from '@tanstack/react-query'
import { Globe, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

interface DomainReputationBadgeProps {
  sourceUrl?: string
  className?: string
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function DomainReputationBadge({ sourceUrl, className }: DomainReputationBadgeProps) {
  const { t } = useTranslation()
  const domain = sourceUrl ? extractDomain(sourceUrl) : null

  const { data: reputation, isLoading } = useQuery({
    queryKey: ['domain-reputation', domain],
    queryFn: () => api.getDomainReputation(domain!),
    enabled: Boolean(domain),
    retry: false,
  })

  if (!domain) return null

  const avgScore = reputation?.avgTrustScore
  const isLowTrust = avgScore != null && avgScore < 40

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 border border-accent/20 bg-accent/5 px-3 py-2',
        className,
      )}
      role="status"
      aria-label={t('report.domainReputation')}
    >
      <Globe className="size-4 shrink-0 text-accent-secondary" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] text-card-foreground/45">
          {t('report.domainReputation')}
        </p>
        <p className="truncate text-sm font-medium text-card-foreground">{domain}</p>
      </div>

      {isLoading ? (
        <span className="font-mono text-xs text-card-foreground/45">…</span>
      ) : reputation ? (
        <div className="flex items-center gap-3 font-mono text-[10px] text-card-foreground/60">
          {isLowTrust ? (
            <ShieldAlert className="size-4 text-danger" strokeWidth={1.5} />
          ) : (
            <ShieldCheck className="size-4 text-success" strokeWidth={1.5} />
          )}
          <span>
            Avg{' '}
            <span className="tabular-nums text-card-foreground">
              {Math.round(reputation.avgTrustScore)}
            </span>
          </span>
          <span>
            Cases <span className="tabular-nums">{reputation.caseCount}</span>
          </span>
          {reputation.lowTrustCount > 0 && (
            <span className="text-danger">
              Low trust <span className="tabular-nums">{reputation.lowTrustCount}</span>
            </span>
          )}
        </div>
      ) : (
        <span className="font-mono text-[10px] text-card-foreground/45">
          First analysis from this domain
        </span>
      )}
    </div>
  )
}
