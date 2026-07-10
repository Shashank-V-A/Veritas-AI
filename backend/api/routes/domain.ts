import { Router } from 'express'
import { getDomainReputation } from '../../services/domain/reputation.js'

export const domainRouter = Router()

domainRouter.get('/:domain', async (req, res, next) => {
  try {
    const domain = decodeURIComponent(req.params.domain).replace(/^www\./, '')
    const reputation = await getDomainReputation(domain)
    if (!reputation) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Domain not in archive' } })
      return
    }
    res.json(reputation)
  } catch (error) {
    next(error)
  }
})
