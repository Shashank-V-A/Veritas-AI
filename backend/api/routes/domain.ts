import { Router } from 'express'
import { getDomainReputation } from '../../services/domain/reputation.js'
import { getDomainDossier } from '../../services/domain/dossier.js'
import { optionalAuth } from '../middleware/auth.js'

export const domainRouter = Router()

domainRouter.get('/:domain/dossier', optionalAuth, async (req, res, next) => {
  try {
    const raw = req.params.domain
    const domain = decodeURIComponent(Array.isArray(raw) ? raw[0]! : raw).replace(
      /^www\./,
      '',
    )
    const dossier = await getDomainDossier(domain, req.user?.sub)
    if (!dossier.reputation && dossier.cases.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Domain not in archive' } })
      return
    }
    res.json(dossier)
  } catch (error) {
    next(error)
  }
})

domainRouter.get('/:domain', async (req, res, next) => {
  try {
    const raw = req.params.domain
    const domain = decodeURIComponent(Array.isArray(raw) ? raw[0]! : raw).replace(
      /^www\./,
      '',
    )
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
