import { Router } from 'express'
import { cacheControl } from '../middleware/cacheControl.js'
import { reportRepository } from '../../services/report/repository.js'
import { historyQuerySchema } from '../../utils/validation.js'

export const historyRouter = Router()

historyRouter.get('/', cacheControl(30), async (req, res, next) => {
  try {
    const query = historyQuerySchema.parse(req.query)
    const { items, total } = await reportRepository.findHistory(query)

    res.json({
      items,
      total,
      page: query.page,
      limit: query.limit,
    })
  } catch (error) {
    next(error)
  }
})
