import { prisma } from '../../db/prisma.js'
import { searchWeb } from '../search/webSearch.js'
import { claimsMatch, normalizeClaimText } from './normalize.js'
import { createNotification } from '../notify/notifications.js'
import { isEmailConfigured, sendWatchHitEmail } from '../notify/email.js'

function appBaseUrl(): string {
  return (
    process.env.PUBLIC_APP_URL?.replace(/\/$/, '') ||
    process.env.FRONTEND_URL?.replace(/\/$/, '') ||
    'http://localhost:5173'
  )
}

function resultLooksRelated(
  claimNorm: string,
  title: string,
  snippet: string,
): boolean {
  const blob = normalizeClaimText(`${title} ${snippet}`)
  if (!blob) return false
  if (claimsMatch(claimNorm, blob)) return true
  // Looser web match: enough significant claim words appear in the result
  const words = claimNorm.split(' ').filter((w) => w.length > 4)
  if (words.length === 0) return false
  const hits = words.filter((w) => blob.includes(w)).length
  return hits / words.length >= 0.45
}

export async function scanWatchForWebHits(
  watchId: string,
  userId: string,
): Promise<{ newHits: number; scanned: boolean }> {
  const watch = await prisma.claimWatch.findFirst({
    where: { id: watchId, userId },
    include: { user: { select: { email: true } } },
  })
  if (!watch) return { newHits: 0, scanned: false }

  const query = watch.claimText.slice(0, 160)
  const results = await searchWeb(query, 6)

  const existing = await prisma.claimWatchHit.findMany({
    where: { watchId: watch.id, source: 'web' },
    select: { url: true },
  })
  const seenUrls = new Set(
    existing.map((h) => h.url).filter((u): u is string => Boolean(u)),
  )

  const fresh = results.filter((r) => {
    if (!r.url || seenUrls.has(r.url)) return false
    return resultLooksRelated(watch.claimNorm, r.title, r.snippet)
  })

  let newHits = 0
  const createdDetails: Array<{ title?: string | null; url?: string | null }> =
    []

  for (const r of fresh) {
    try {
      await prisma.claimWatchHit.create({
        data: {
          watchId: watch.id,
          source: 'web',
          title: r.title.slice(0, 300),
          url: r.url.slice(0, 2000),
          snippet: r.snippet.slice(0, 800),
        },
      })
      newHits += 1
      createdDetails.push({ title: r.title, url: r.url })
      seenUrls.add(r.url)
    } catch {
      /* unique race — ignore */
    }
  }

  await prisma.claimWatch.update({
    where: { id: watch.id },
    data: {
      lastWebScanAt: new Date(),
      ...(newHits > 0
        ? {
            webHitCount: { increment: newHits },
            lastSeenAt: new Date(),
          }
        : {}),
    },
  })

  if (newHits > 0) {
    await createNotification({
      userId,
      type: 'watch_web_hit',
      title: `Web hit: claim resurfaced (${newHits})`,
      body: watch.claimText.slice(0, 180),
      href: '/app/watchlist',
      meta: { watchId: watch.id, newHits },
    })

    if (watch.emailAlerts && isEmailConfigured()) {
      await sendWatchHitEmail({
        to: watch.user.email,
        claimText: watch.claimText,
        source: 'web',
        hitCount: newHits,
        details: createdDetails,
        watchlistUrl: `${appBaseUrl()}/app/watchlist`,
      })
    }
  }

  return { newHits, scanned: true }
}

export async function scanUserWatches(userId: string): Promise<{
  scanned: number
  newHits: number
}> {
  const watches = await prisma.claimWatch.findMany({
    where: { userId },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 40,
  })

  let newHits = 0
  for (const w of watches) {
    const result = await scanWatchForWebHits(w.id, userId)
    newHits += result.newHits
  }
  return { scanned: watches.length, newHits }
}

export async function scanAllWatches(): Promise<{
  users: number
  watches: number
  newHits: number
}> {
  const watches = await prisma.claimWatch.findMany({
    select: { id: true, userId: true },
    orderBy: { lastWebScanAt: 'asc' },
    take: 100,
  })

  const userIds = new Set<string>()
  let newHits = 0
  for (const w of watches) {
    userIds.add(w.userId)
    const result = await scanWatchForWebHits(w.id, w.userId)
    newHits += result.newHits
  }
  return { users: userIds.size, watches: watches.length, newHits }
}
