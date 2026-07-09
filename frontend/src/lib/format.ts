import type { ClaimStatus, Verdict } from '@/types'

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function getTrustScoreColor(score: number): string {
  if (score >= 70) return 'text-success'
  if (score >= 40) return 'text-warning'
  return 'text-danger'
}

export function getTrustScoreBg(score: number): string {
  if (score >= 70) return 'bg-success/10 border-success/20'
  if (score >= 40) return 'bg-warning/10 border-warning/20'
  return 'bg-danger/10 border-danger/20'
}

export function getVerdictLabel(verdict: Verdict): string {
  const labels: Record<Verdict, string> = {
    credible: 'Credible',
    mixed: 'Mixed',
    misleading: 'Misleading',
    unsupported: 'Unsupported',
  }
  return labels[verdict]
}

export function getVerdictColor(verdict: Verdict): string {
  const colors: Record<Verdict, string> = {
    credible: 'text-success bg-success/10 border-success/20',
    mixed: 'text-warning bg-warning/10 border-warning/20',
    misleading: 'text-danger bg-danger/10 border-danger/20',
    unsupported: 'text-muted-foreground bg-surface-secondary border-border',
  }
  return colors[verdict]
}

export function getClaimStatusLabel(status: ClaimStatus): string {
  const labels: Record<ClaimStatus, string> = {
    verified: 'Verified',
    disputed: 'Disputed',
    unverified: 'Unverified',
    false: 'False',
  }
  return labels[status]
}

export function getClaimStatusColor(status: ClaimStatus): string {
  const colors: Record<ClaimStatus, string> = {
    verified: 'text-success bg-success/10 border-success/20',
    disputed: 'text-warning bg-warning/10 border-warning/20',
    unverified: 'text-muted-foreground bg-surface-secondary border-border',
    false: 'text-danger bg-danger/10 border-danger/20',
  }
  return colors[status]
}
