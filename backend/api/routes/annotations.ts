import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { reportRepository } from '../../services/report/repository.js'
import { requireAuth } from '../middleware/auth.js'

export const annotationsRouter = Router()

annotationsRouter.use(requireAuth)

annotationsRouter.get('/:analysisId', async (req, res, next) => {
  try {
    await reportRepository.findById(req.params.analysisId, req.user!.sub)
    const notes = await prisma.caseAnnotation.findMany({
      where: { analysisId: req.params.analysisId },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ annotations: notes })
  } catch (error) {
    next(error)
  }
})

annotationsRouter.post('/:analysisId', async (req, res, next) => {
  try {
    await reportRepository.findById(req.params.analysisId, req.user!.sub)
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : ''
    if (!note) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'note is required' } })
      return
    }

    const claimIndex =
      typeof req.body?.claimIndex === 'number' ? req.body.claimIndex : undefined

    const annotation = await prisma.caseAnnotation.create({
      data: {
        analysisId: req.params.analysisId,
        userId: req.user!.sub,
        note: note.slice(0, 2000),
        claimIndex,
      },
    })

    res.status(201).json(annotation)
  } catch (error) {
    next(error)
  }
})
