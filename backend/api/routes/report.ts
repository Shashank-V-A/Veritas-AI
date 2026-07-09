import { Router } from 'express'
import { cacheControl } from '../middleware/cacheControl.js'
import { reportRepository } from '../../services/report/repository.js'
import { reportIdSchema } from '../../utils/validation.js'

export const reportRouter = Router()

reportRouter.get('/:id', cacheControl(300), async (req, res, next) => {
  try {
    const { id } = reportIdSchema.parse(req.params)
    const record = await reportRepository.findById(id, req.user?.sub)

    res.json({
      id: record.id,
      title: record.title,
      content: record.content,
      sourceType: record.sourceType,
      report: record.report,
      createdAt: record.createdAt,
    })
  } catch (error) {
    next(error)
  }
})
