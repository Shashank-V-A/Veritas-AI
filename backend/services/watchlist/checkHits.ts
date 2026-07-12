import { prisma } from '../../db/prisma.js'
import { claimsMatch, normalizeClaimText } from '../watchlist/normalize.js'
import { createNotification } from '../notify/notifications.js'
import { isEmailConfigured, sendWatchHitEmail } from '../notify/email.js'
import type { CredibilityReport } from '@veritas/shared'

function appBaseUrl(): string {
  return (
    process.env.PUBLIC_APP_URL?.replace(/\/$/, '') ||
    process.env.FRONTEND_URL?.replace(/\/$/, '') ||
    'http://localhost:5173'
  )
}

/**
 * After a new analysis is saved, record matching claim watches + notify.
 */
export async function checkWatchlistHits(
  userId: string | undefined,
  analysisId: string,
  report: CredibilityReport,
): Promise<{ hits: number }> {
  if (!userId) return { hits: 0 }

  const watches = await prisma.claimWatch.findMany({
    where: { userId },
    include: { user: { select: { email: true } } },
  })
  if (watches.length === 0) return { hits: 0 }

  const claimNorms = (report.claims ?? []).map((c) => normalizeClaimText(c.claim))
  let hits = 0

  for (const watch of watches) {
    if (watch.sourceAnalysisId === analysisId) continue

    const matched = claimNorms.some((norm) => claimsMatch(watch.claimNorm, norm))
    if (!matched) continue

    await prisma.claimWatch.update({
      where: { id: watch.id },
      data: {
        hitCount: { increment: 1 },
        lastSeenAt: new Date(),
        lastHitAnalysisId: analysisId,
      },
    })

    await prisma.claimWatchHit.create({
      data: {
        watchId: watch.id,
        source: 'analysis',
        title: report.summary?.slice(0, 200) ?? 'Matching case',
        analysisId,
        snippet: (report.claims ?? [])
          .map((c) => c.claim)
          .find((c) => claimsMatch(watch.claimNorm, normalizeClaimText(c)))
          ?.slice(0, 400),
      },
    })

    await createNotification({
      userId,
      type: 'watch_analysis_hit',
      title: 'Case hit: watched claim reappeared',
      body: watch.claimText.slice(0, 180),
      href: `/app/analysis/${analysisId}`,
      meta: { watchId: watch.id, analysisId },
    })

    if (watch.emailAlerts && isEmailConfigured()) {
      await sendWatchHitEmail({
        to: watch.user.email,
        claimText: watch.claimText,
        source: 'analysis',
        hitCount: 1,
        details: [{ title: 'Open matching case', url: `${appBaseUrl()}/app/analysis/${analysisId}` }],
        watchlistUrl: `${appBaseUrl()}/app/watchlist`,
      })
    }

    hits += 1
  }

  return { hits }
}
