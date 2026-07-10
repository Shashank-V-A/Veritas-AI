import { Router } from 'express'
import { reportRepository } from '../../services/report/repository.js'
import { buildShareOgSvg } from '../../services/og/shareCard.js'
import { shareTokenSchema } from '../../utils/validation.js'

export const ogRouter = Router()

ogRouter.get('/share/:token', async (req, res, next) => {
  try {
    const { token } = shareTokenSchema.parse({ token: req.params.token })
    const report = await reportRepository.findPublicByToken(token)
    const svg = buildShareOgSvg(report)

    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(svg)
  } catch (error) {
    next(error)
  }
})
