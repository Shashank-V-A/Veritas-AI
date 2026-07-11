import { Router } from 'express'
import { getGraphSnapshot } from '../../services/graph/neo4j.js'
import { requireAuth } from '../middleware/auth.js'

export const graphRouter = Router()

graphRouter.use(requireAuth)

graphRouter.get('/', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 40)
    const snapshot = await getGraphSnapshot(Number.isFinite(limit) ? limit : 40)
    res.json(snapshot)
  } catch (error) {
    next(error)
  }
})
