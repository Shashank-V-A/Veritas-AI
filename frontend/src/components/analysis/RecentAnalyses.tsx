import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { AnalysisCard } from '@/components/analysis/AnalysisCard'
import { EmptyState } from '@/components/analysis/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useHistory } from '@/hooks/useHistory'

interface RecentAnalysesProps {
  limit?: number
}

export function RecentAnalyses({ limit = 5 }: RecentAnalysesProps) {
  const { data, isLoading, isError } = useHistory({ limit })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl shimmer" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-card-foreground/60">
        Could not load recent analyses.
      </p>
    )
  }

  const items = data?.items ?? []

  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No case files yet"
        description="Submit evidence from the workspace, or open a sample case file to see how a dossier is structured."
        action={
          <Button variant="outline" size="sm" asChild className="border-accent/30">
            <Link to={ROUTES.dashboard}>Go to workspace</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <AnalysisCard key={item.id} item={item} index={index} />
      ))}

      {(data?.total ?? 0) > limit && (
        <div className="pt-2 text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.history}>View all history</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
