import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { History, Search, ChevronDown } from 'lucide-react'
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

const VERDICT_FILTERS: { value: Verdict | ''; label: string }[] = [
  { value: '', label: 'All verdicts' },
  { value: 'credible', label: 'Credible' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'misleading', label: 'Misleading' },
  { value: 'unsupported', label: 'Unsupported' },
]

export function HistoryList() {
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

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            placeholder="Search cases and claims…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="border border-border bg-elevated pl-9 text-foreground placeholder:text-muted-foreground"
            aria-label="Search analyses"
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
            aria-label="Filter by category"
          >
            <option value="" className="bg-elevated text-foreground">
              All categories
            </option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-elevated text-foreground"
              >
                {opt.label}
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
            aria-label="Filter by verdict"
          >
            {VERDICT_FILTERS.map((opt) => (
              <option
                key={opt.value || 'all'}
                value={opt.value}
                className="bg-elevated text-foreground"
              >
                {opt.label}
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

        {isError && <p className="text-sm text-danger">Failed to load history.</p>}

        {!isLoading && !isError && items.length === 0 && (
          <>
            <EmptyState
              icon={History}
              title={hasFilters ? 'No results found' : 'No case files yet'}
              description={
                hasFilters
                  ? 'Try different filters or run a new analysis.'
                  : 'Open a sample case below or file your first investigation.'
              }
              action={
                !hasFilters ? (
                  <Button size="sm" asChild>
                    <Link to={ROUTES.dashboard}>New analysis</Link>
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
              {data?.total} {data?.total === 1 ? 'case file' : 'case files'}
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
                  Previous
                </Button>
                <span className="text-xs text-card-foreground/60">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
