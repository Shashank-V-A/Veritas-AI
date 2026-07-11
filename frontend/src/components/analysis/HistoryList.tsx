import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { History, Search, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/constants'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import type { Verdict } from '@veritas/shared'
import { AnalysisCard } from '@/components/analysis/AnalysisCard'
import { CaseSampleCard } from '@/components/dashboard/CaseSampleCard'
import { EmptyState } from '@/components/analysis/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EXAMPLE_PROMPTS } from '@/lib/sampleReport'
import { useDebounce } from '@/hooks/useDebounce'
import { useHistory } from '@/hooks/useHistory'

const VERDICT_FILTER_VALUES: (Verdict | '')[] = [
  '',
  'credible',
  'mixed',
  'misleading',
  'unsupported',
]

export function HistoryList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [verdict, setVerdict] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading, isError } = useHistory({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    category: category || undefined,
    verdict: verdict || undefined,
  })

  const items = data?.items ?? []
  const totalPages = data ? Math.ceil(data.total / data.limit) : 0
  const hasFilters = Boolean(debouncedSearch || category || verdict)

  const verdictLabel = (value: Verdict | '') => {
    if (value === '') return t('history.allVerdicts')
    return t(`history.${value}`)
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            placeholder={t('history.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="border border-border bg-elevated pl-9 text-foreground placeholder:text-muted-foreground"
            aria-label={t('history.searchAria')}
          />
        </div>
        <div className="relative shrink-0 sm:w-44">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full appearance-none rounded-md border border-border bg-elevated py-0 pl-3 pr-9 text-sm text-foreground [color-scheme:dark]"
            aria-label={t('history.filterCategory')}
          >
            <option value="" className="bg-elevated text-foreground">
              {t('history.allCategories')}
            </option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-elevated text-foreground"
              >
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
        <div className="relative shrink-0 sm:w-40">
          <select
            value={verdict}
            onChange={(e) => {
              setVerdict(e.target.value)
              setPage(1)
            }}
            className="h-9 w-full appearance-none rounded-md border border-border bg-elevated py-0 pl-3 pr-9 text-sm text-foreground [color-scheme:dark]"
            aria-label={t('history.filterVerdict')}
          >
            {VERDICT_FILTER_VALUES.map((value) => (
              <option
                key={value || 'all'}
                value={value}
                className="bg-elevated text-foreground"
              >
                {verdictLabel(value)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-xl shimmer" />
            ))}
          </div>
        )}

        {isError && <p className="text-sm text-danger">{t('history.loadFailed')}</p>}

        {!isLoading && !isError && items.length === 0 && (
          <>
            <EmptyState
              icon={History}
              title={hasFilters ? t('history.noResults') : t('history.noCases')}
              description={
                hasFilters
                  ? t('history.tryFilters')
                  : t('history.openSample')
              }
              action={
                !hasFilters ? (
                  <Button size="sm" asChild>
                    <Link to={ROUTES.dashboard}>{t('history.newAnalysis')}</Link>
                  </Button>
                ) : undefined
              }
            />
            {!hasFilters && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {EXAMPLE_PROMPTS.map((example) => (
                  <CaseSampleCard
                    key={example.label}
                    category={example.category}
                    label={example.label}
                    trustScore={example.trustScore}
                    riskLabel={example.riskLabel}
                    prefill={{
                      content: example.content,
                      sourceType: example.sourceType,
                      title: example.title,
                    }}
                    onSelect={() => navigate(ROUTES.dashboard)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!isLoading && items.length > 0 && (
          <>
            <p className="mb-4 font-mono text-xs text-card-foreground/60">
              {data?.total}{' '}
              {data?.total === 1 ? t('history.caseFile') : t('history.caseFiles')}
            </p>
            <div className="space-y-3">
              {items.map((item, index) => (
                <AnalysisCard key={item.id} item={item} index={index} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t('history.previous')}
                </Button>
                <span className="text-xs text-card-foreground/60">
                  {t('history.pageOf', { page, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('history.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
