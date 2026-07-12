import { prisma } from '../../db/prisma.js'
import { normalizeClaimText } from '../watchlist/normalize.js'

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

export async function getDomainDossier(domain: string, userId?: string) {
  const normalized = domain.replace(/^www\./, '').toLowerCase()
  const reputation = await prisma.domainReputation.findUnique({
    where: { domain: normalized },
  })

  const rows = await prisma.analysis.findMany({
    where: {
      ...(userId ? { userId } : {}),
      sourceUrl: { contains: normalized },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      title: true,
      trustScore: true,
      verdict: true,
      sourceUrl: true,
      createdAt: true,
      report: true,
    },
  })

  const cases = rows
    .filter((row) => extractDomain(row.sourceUrl) === normalized)
    .map((row) => ({
      id: row.id,
      title: row.title,
      trustScore: row.trustScore,
      verdict: row.verdict,
      sourceUrl: row.sourceUrl,
      createdAt: row.createdAt.toISOString(),
    }))

  // Trust trend by day
  const byDay = new Map<string, { sum: number; count: number }>()
  for (const c of cases) {
    const day = c.createdAt.slice(0, 10)
    const prev = byDay.get(day) ?? { sum: 0, count: 0 }
    prev.sum += c.trustScore
    prev.count += 1
    byDay.set(day, prev)
  }
  const trend = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { sum, count }]) => ({
      date,
      avgTrustScore: Math.round(sum / count),
      caseCount: count,
    }))

  // Common claims across cases
  const claimCounts = new Map<string, { text: string; count: number }>()
  for (const row of rows) {
    if (extractDomain(row.sourceUrl) !== normalized) continue
    try {
      const report = JSON.parse(row.report) as {
        claims?: Array<{ claim: string }>
      }
      for (const claim of report.claims ?? []) {
        const norm = normalizeClaimText(claim.claim)
        if (norm.length < 12) continue
        const prev = claimCounts.get(norm)
        if (prev) prev.count += 1
        else claimCounts.set(norm, { text: claim.claim, count: 1 })
      }
    } catch {
      /* ignore bad JSON */
    }
  }
  const commonClaims = [...claimCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  return {
    domain: normalized,
    reputation: reputation
      ? {
          domain: reputation.domain,
          caseCount: reputation.caseCount,
          lowTrustCount: reputation.lowTrustCount,
          avgTrustScore: reputation.avgTrustScore,
          updatedAt: reputation.updatedAt.toISOString(),
        }
      : null,
    cases,
    trend,
    commonClaims,
  }
}
