import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Globe, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { api } from '@/services/api'
import { ROUTES } from '@/lib/constants'
import { formatRelativeDate } from '@/lib/format'
import { Button } from '@/components/ui/button'

export function DomainDossierPage() {
  const { t } = useTranslation()
  const { domain: raw } = useParams<{ domain: string }>()
  const domain = raw ? decodeURIComponent(raw) : ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['domain-dossier', domain],
    queryFn: () => api.getDomainDossier(domain),
    enabled: Boolean(domain),
    retry: false,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-10">
      <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
        <Link to={ROUTES.history}>
          <ArrowLeft className="size-4" />
          {t('domain.back')}
        </Link>
      </Button>

      <header className="mb-8">
        <p className="meta-label flex items-center gap-2 text-accent">
          <Globe className="size-3" strokeWidth={1.75} />
          {t('domain.eyebrow')}
        </p>
        <h1 className="mt-2 font-display text-3xl text-foreground">{domain}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t('domain.body')}</p>
      </header>

      {isLoading && (
        <p className="font-mono text-sm text-muted-foreground">{t('domain.loading')}</p>
      )}
      {error && (
        <p className="text-sm text-danger">{t('domain.notFound')}</p>
      )}

      {data && (
        <div className="space-y-8">
          {data.reputation && (
            <div className="border border-accent/20 bg-accent/5 px-4 py-3">
              <div className="flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
                <span>
                  {t('domain.avgTrust')}{' '}
                  <strong className="text-foreground">
                    {Math.round(data.reputation.avgTrustScore)}
                  </strong>
                </span>
                <span>
                  {t('domain.cases')}{' '}
                  <strong className="text-foreground">{data.reputation.caseCount}</strong>
                </span>
                {data.reputation.lowTrustCount > 0 && (
                  <span className="flex items-center gap-1 text-danger">
                    <ShieldAlert className="size-3.5" />
                    {t('domain.lowTrust')} {data.reputation.lowTrustCount}
                  </span>
                )}
              </div>
            </div>
          )}

          {data.trend.length > 0 && (
            <section>
              <h2 className="font-display text-lg text-foreground">{t('domain.trend')}</h2>
              <ul className="mt-3 space-y-1 font-mono text-xs text-muted-foreground">
                {data.trend.map((point) => (
                  <li key={point.date} className="flex justify-between border-b border-border/60 py-1.5">
                    <span>{point.date}</span>
                    <span>
                      {t('domain.avgTrust')} {point.avgTrustScore} · {point.caseCount}{' '}
                      {t('domain.casesShort')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.commonClaims.length > 0 && (
            <section>
              <h2 className="font-display text-lg text-foreground">{t('domain.commonClaims')}</h2>
              <ul className="mt-3 space-y-2">
                {data.commonClaims.map((claim) => (
                  <li
                    key={claim.text}
                    className="border border-border bg-elevated/40 px-3 py-2 text-sm text-foreground"
                  >
                    <span className="font-mono text-[10px] text-accent">×{claim.count}</span>
                    <p className="mt-1">{claim.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-display text-lg text-foreground">{t('domain.caseList')}</h2>
            {data.cases.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t('domain.noCases')}</p>
            ) : (
              <ul className="mt-3 divide-y divide-border border border-border">
                {data.cases.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={ROUTES.analysis(c.id)}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-elevated"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {c.title || t('report.untitled')}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {formatRelativeDate(c.createdAt)}
                          {c.verdict ? ` · ${c.verdict}` : ''}
                        </p>
                      </div>
                      <span className="font-mono text-sm tabular-nums text-accent">
                        {c.trustScore}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
