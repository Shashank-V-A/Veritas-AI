import { prisma } from '../../db/prisma.js'

export async function recordDomainAnalysis(
  sourceUrl: string | undefined,
  trustScore: number,
): Promise<{ domain?: string; caseCount?: number; lowTrustCount?: number; avgTrustScore?: number }> {
  if (!sourceUrl) return {}

  let domain: string
  try {
    domain = new URL(sourceUrl).hostname.replace(/^www\./, '')
  } catch {
    return {}
  }

  const existing = await prisma.domainReputation.findUnique({ where: { domain } })
  const caseCount = (existing?.caseCount ?? 0) + 1
  const lowTrustCount = (existing?.lowTrustCount ?? 0) + (trustScore < 40 ? 1 : 0)
  const avgTrustScore = existing
    ? (existing.avgTrustScore * existing.caseCount + trustScore) / caseCount
    : trustScore

  await prisma.domainReputation.upsert({
    where: { domain },
    create: { domain, caseCount: 1, lowTrustCount: trustScore < 40 ? 1 : 0, avgTrustScore: trustScore },
    update: { caseCount, lowTrustCount, avgTrustScore },
  })

  return { domain, caseCount, lowTrustCount, avgTrustScore }
}

export async function getDomainReputation(domain: string) {
  return prisma.domainReputation.findUnique({ where: { domain } })
}
