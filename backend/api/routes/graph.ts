import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import {
  getGraphSnapshot,
  pruneAnalysesMissingFromDb,
} from '../../services/graph/neo4j.js'
import { buildNarrativeClusters } from '../../services/graph/narratives.js'
import { requireAuth } from '../middleware/auth.js'

export const graphRouter = Router()

graphRouter.use(requireAuth)

graphRouter.get('/narratives', async (req, res, next) => {
  try {
    const userId = req.user?.sub
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Sign in required' },
      })
      return
    }
    const parsed = Number.parseInt(String(req.query.limit ?? '8'), 10)
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 8
    const clusters = await buildNarrativeClusters(userId, limit)
    res.json({ clusters })
  } catch (error) {
    next(error)
  }
})

graphRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user?.sub
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Sign in required' },
      })
      return
    }

    const parsed = Number.parseInt(String(req.query.limit ?? '40'), 10)
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 40

    // Scope the constellation to this user's case files
    const rows = await prisma.analysis.findMany({
      where: { userId },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    const analysisIds = rows.map((row) => row.id)

    // Drop Neo4j leftovers from deleted cases (global DB ids keep other users safe)
    const allExisting = await prisma.analysis.findMany({ select: { id: true } })
    await pruneAnalysesMissingFromDb(allExisting.map((row) => row.id))

    const snapshot = await getGraphSnapshot(limit, { analysisIds })
    res.json(snapshot)
  } catch (error) {
    next(error)
  }
})
