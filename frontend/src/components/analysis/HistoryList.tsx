import { useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Search } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { AnalysisCard } from '@/components/analysis/AnalysisCard'
import { EmptyState } from '@/components/analysis/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import { useHistory } from '@/hooks/useHistory'

export function HistoryList() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading, isError } = useHistory({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  })

  const items = data?.items ?? []
  const totalPages = data ? Math.ceil(data.total / data.limit) : 0

  return (
    <div className="mt-8">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          strokeWidth={1.75}
        />
        <Input
          placeholder="Search analyses..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="border border-accent/20 bg-accent/5 pl-9 text-card-foreground placeholder:text-card-foreground/40"
          aria-label="Search analyses"
        />
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-xl shimmer" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-danger">Failed to load history.</p>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <EmptyState
            icon={History}
            title={debouncedSearch ? 'No results found' : 'No history yet'}
            description={
              debouncedSearch
                ? 'Try a different search term or run a new analysis.'
                : 'Completed analyses will appear here once you analyze content.'
            }
            action={
              !debouncedSearch ? (
                <Button size="sm" asChild>
                  <Link to={ROUTES.dashboard}>New analysis</Link>
                </Button>
              ) : undefined
            }
          />
        )}

        {!isLoading && items.length > 0 && (
          <>
            <p className="mb-4 text-xs text-card-foreground/60">
              {data?.total} {data?.total === 1 ? 'analysis' : 'analyses'}
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
