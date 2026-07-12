import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { normalizeClaimText } from '../../services/watchlist/normalize.js'
import {
  scanUserWatches,
  scanWatchForWebHits,
} from '../../services/watchlist/scanWeb.js'
import { isEmailConfigured } from '../../services/notify/email.js'

export const watchlistRouter = Router()

watchlistRouter.use(requireAuth)

watchlistRouter.get('/', async (req, res, next) => {
  try {
    const items = await prisma.claimWatch.findMany({
      where: { userId: req.user!.sub },
      orderBy: [{ lastSeenAt: 'desc' }, { createdAt: 'desc' }],
    })
    res.json({
      items,
      emailConfigured: isEmailConfigured(),
    })
  } catch (error) {
    next(error)
  }
})

watchlistRouter.post('/scan', async (req, res, next) => {
  try {
    const result = await scanUserWatches(req.user!.sub)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

watchlistRouter.post('/', async (req, res, next) => {
  try {
    const claimText =
      typeof req.body?.claimText === 'string' ? req.body.claimText.trim() : ''
    if (!claimText) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'claimText is required' },
      })
      return
    }

    const claimNorm = normalizeClaimText(claimText)
    if (claimNorm.length < 8) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Claim text too short' },
      })
      return
    }

    const sourceAnalysisId =
      typeof req.body?.sourceAnalysisId === 'string'
        ? req.body.sourceAnalysisId
        : undefined

    const item = await prisma.claimWatch.upsert({
      where: {
        userId_claimNorm: {
          userId: req.user!.sub,
          claimNorm,
        },
      },
      create: {
        userId: req.user!.sub,
        claimText: claimText.slice(0, 2000),
        claimNorm,
        sourceAnalysisId,
        emailAlerts: true,
        browserAlerts: true,
      },
      update: {
        claimText: claimText.slice(0, 2000),
        sourceAnalysisId: sourceAnalysisId ?? undefined,
      },
    })

    res.status(201).json(item)
  } catch (error) {
    next(error)
  }
})

watchlistRouter.post('/:id/scan', async (req, res, next) => {
  try {
    const result = await scanWatchForWebHits(req.params.id, req.user!.sub)
    if (!result.scanned) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Watch not found' } })
      return
    }
    res.json(result)
  } catch (error) {
    next(error)
  }
})

watchlistRouter.get('/:id/hits', async (req, res, next) => {
  try {
    const watch = await prisma.claimWatch.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
    })
    if (!watch) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Watch not found' } })
      return
    }
    const hits = await prisma.claimWatchHit.findMany({
      where: { watchId: watch.id },
      orderBy: { discoveredAt: 'desc' },
      take: 50,
    })
    res.json({ hits, watch })
  } catch (error) {
    next(error)
  }
})

watchlistRouter.patch('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.claimWatch.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
    })
    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Watch not found' } })
      return
    }

    const data: { emailAlerts?: boolean; browserAlerts?: boolean } = {}
    if (typeof req.body?.emailAlerts === 'boolean') data.emailAlerts = req.body.emailAlerts
    if (typeof req.body?.browserAlerts === 'boolean') {
      data.browserAlerts = req.body.browserAlerts
    }

    const item = await prisma.claimWatch.update({
      where: { id: existing.id },
      data,
    })
    res.json(item)
  } catch (error) {
    next(error)
  }
})

watchlistRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.claimWatch.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
    })
    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Watch not found' } })
      return
    }
    await prisma.claimWatch.delete({ where: { id: existing.id } })
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})
