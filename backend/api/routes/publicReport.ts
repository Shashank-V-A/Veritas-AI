import { Router } from 'express'
import { cacheControl } from '../middleware/cacheControl.js'
import { reportRepository } from '../../services/report/repository.js'
import { shareTokenSchema } from '../../utils/validation.js'

export const publicReportRouter = Router()

publicReportRouter.get('/:token', cacheControl(300), async (req, res, next) => {
  try {
    const { token } = shareTokenSchema.parse({ token: req.params.token })
    const report = await reportRepository.findPublicByToken(token)
    res.json(report)
  } catch (error) {
    next(error)
  }
})
