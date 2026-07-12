import type { Claim } from '@veritas/shared'
import { ClaimCard } from '@/components/analysis/report/ClaimCard'

interface ClaimBreakdownProps {
  claims: Claim[]
  analysisId?: string
  allowWatch?: boolean
}

export function ClaimBreakdown({
  claims,
  analysisId,
  allowWatch = false,
}: ClaimBreakdownProps) {
  if (claims.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No distinct claims were identified in this content.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {claims.map((claim, index) => (
        <ClaimCard
          key={`${claim.claim}-${index}`}
          claim={claim}
          index={index}
          variant="dossier"
          analysisId={analysisId}
          allowWatch={allowWatch}
        />
      ))}
    </div>
  )
}
