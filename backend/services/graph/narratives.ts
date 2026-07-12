import { prisma } from '../../db/prisma.js'
import { normalizeClaimText, claimsMatch } from '../watchlist/normalize.js'

export type NarrativeCluster = {
  id: string
  title: string
  theme: string
  caseIds: string[]
  cases: Array<{
    id: string
    title: string | null
    trustScore: number
    verdict: string | null
    createdAt: string
  }>
  sharedClaims: string[]
  avgTrustScore: number
}

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

/**
 * Cluster a user's cases by shared domain or overlapping claim text
 * so Judge mode can present a narrative, not a single article.
 */
export async function buildNarrativeClusters(
  userId: string,
  limit = 8,
): Promise<NarrativeCluster[]> {
  const rows = await prisma.analysis.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 80,
    select: {
      id: true,
      title: true,
      trustScore: true,
      verdict: true,
      sourceUrl: true,
      createdAt: true,
      report: true,
      category: true,
    },
  })

  if (rows.length === 0) return []

  type CaseNode = {
    id: string
    title: string | null
    trustScore: number
    verdict: string | null
    createdAt: string
    domain: string | null
    category: string | null
    claims: string[]
  }

  const nodes: CaseNode[] = rows.map((row) => {
    let claims: string[] = []
    try {
      const report = JSON.parse(row.report) as { claims?: Array<{ claim: string }> }
      claims = (report.claims ?? []).map((c) => normalizeClaimText(c.claim)).filter(Boolean)
    } catch {
      claims = []
    }
    return {
      id: row.id,
      title: row.title,
      trustScore: row.trustScore,
      verdict: row.verdict,
      createdAt: row.createdAt.toISOString(),
      domain: extractDomain(row.sourceUrl),
      category: row.category,
      claims,
    }
  })

  // Union-find clustering by domain OR claim overlap
  const parent = new Map<string, string>()
  const find = (id: string): string => {
    const p = parent.get(id) ?? id
    if (p !== id) {
      const root = find(p)
      parent.set(id, root)
      return root
    }
    return id
  }
  const union = (a: string, b: string) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  for (const n of nodes) parent.set(n.id, n.id)

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!
      const b = nodes[j]!
      let related = false
      if (a.domain && b.domain && a.domain === b.domain) related = true
      if (!related && a.category && b.category && a.category === b.category) {
        // weak signal — only if they also share a claim word overlap
        related = a.claims.some((ca) => b.claims.some((cb) => claimsMatch(ca, cb)))
      } else if (!related) {
        related = a.claims.some((ca) => b.claims.some((cb) => claimsMatch(ca, cb)))
      }
      if (related) union(a.id, b.id)
    }
  }

  const groups = new Map<string, CaseNode[]>()
  for (const n of nodes) {
    const root = find(n.id)
    const list = groups.get(root) ?? []
    list.push(n)
    groups.set(root, list)
  }

  const clusters: NarrativeCluster[] = []
  for (const [, members] of groups) {
    if (members.length < 2) continue

    const sharedClaims: string[] = []
    const claimBag = new Map<string, string>()
    for (const m of members) {
      for (const c of m.claims) {
        if (!claimBag.has(c)) claimBag.set(c, c)
      }
    }
    // Prefer claims that appear in 2+ members
    for (const [norm] of claimBag) {
      const count = members.filter((m) =>
        m.claims.some((c) => claimsMatch(c, norm)),
      ).length
      if (count >= 2) {
        const original = members
          .flatMap((m) => m.claims)
          .find((c) => claimsMatch(c, norm))
        if (original) sharedClaims.push(original.slice(0, 120))
      }
    }

    const domain = members.find((m) => m.domain)?.domain
    const theme =
      domain ??
      members.find((m) => m.category)?.category ??
      sharedClaims[0]?.slice(0, 40) ??
      'related cases'

    const avgTrustScore = Math.round(
      members.reduce((s, m) => s + m.trustScore, 0) / members.length,
    )

    clusters.push({
      id: `narrative-${members.map((m) => m.id).sort().join('-').slice(0, 48)}`,
      title: domain
        ? `Outlet cluster · ${domain}`
        : `Narrative · ${theme}`,
      theme,
      caseIds: members.map((m) => m.id),
      cases: members.map((m) => ({
        id: m.id,
        title: m.title,
        trustScore: m.trustScore,
        verdict: m.verdict,
        createdAt: m.createdAt,
      })),
      sharedClaims: sharedClaims.slice(0, 5),
      avgTrustScore,
    })
  }

  return clusters
    .sort((a, b) => b.cases.length - a.cases.length || b.avgTrustScore - a.avgTrustScore)
    .slice(0, limit)
}
