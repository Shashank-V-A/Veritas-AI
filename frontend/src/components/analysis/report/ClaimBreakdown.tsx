import type { Claim } from '@/types'
import { ClaimCard } from '@/components/analysis/report/ClaimCard'

interface ClaimBreakdownProps {
  claims: Claim[]
}

export function ClaimBreakdown({ claims }: ClaimBreakdownProps) {
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
        <ClaimCard key={`${claim.claim}-${index}`} claim={claim} index={index} />
      ))}
    </div>
  )
}
