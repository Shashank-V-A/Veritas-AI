import { Router } from 'express'
import { getGraphSnapshot } from '../../services/graph/neo4j.js'
import { requireAuth } from '../middleware/auth.js'

export const graphRouter = Router()

graphRouter.use(requireAuth)

graphRouter.get('/', async (req, res, next) => {
  try {
    const parsed = Number.parseInt(String(req.query.limit ?? '40'), 10)
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 40
    const snapshot = await getGraphSnapshot(limit)
    res.json(snapshot)
  } catch (error) {
    next(error)
  }
})
