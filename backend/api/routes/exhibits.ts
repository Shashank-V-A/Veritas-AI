import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { reportRepository } from '../../services/report/repository.js'
import { requireAuth } from '../middleware/auth.js'

const ALLOWED_TYPES = new Set(['url', 'note', 'screenshot'])

export const exhibitsRouter = Router()

exhibitsRouter.use(requireAuth)

exhibitsRouter.get('/:analysisId', async (req, res, next) => {
  try {
    await reportRepository.findById(req.params.analysisId, req.user!.sub)
    const exhibits = await prisma.caseExhibit.findMany({
      where: { analysisId: req.params.analysisId, userId: req.user!.sub },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ exhibits })
  } catch (error) {
    next(error)
  }
})

exhibitsRouter.post('/:analysisId', async (req, res, next) => {
  try {
    await reportRepository.findById(req.params.analysisId, req.user!.sub)

    const type = typeof req.body?.type === 'string' ? req.body.type : ''
    if (!ALLOWED_TYPES.has(type)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'type must be url, note, or screenshot',
        },
      })
      return
    }

    const title =
      typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 200) : undefined
    const url =
      typeof req.body?.url === 'string' ? req.body.url.trim().slice(0, 2000) : undefined
    const note =
      typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 4000) : undefined

    if (type === 'url' && !url) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'url is required for url exhibits' },
      })
      return
    }
    if ((type === 'note' || type === 'screenshot') && !note && !url) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'note or url is required',
        },
      })
      return
    }

    const exhibit = await prisma.caseExhibit.create({
      data: {
        analysisId: req.params.analysisId,
        userId: req.user!.sub,
        type,
        title: title || null,
        url: url || null,
        note: note || null,
      },
    })

    res.status(201).json(exhibit)
  } catch (error) {
    next(error)
  }
})

exhibitsRouter.delete('/:analysisId/:exhibitId', async (req, res, next) => {
  try {
    await reportRepository.findById(req.params.analysisId, req.user!.sub)
    const existing = await prisma.caseExhibit.findFirst({
      where: {
        id: req.params.exhibitId,
        analysisId: req.params.analysisId,
        userId: req.user!.sub,
      },
    })
    if (!existing) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Exhibit not found' },
      })
      return
    }
    await prisma.caseExhibit.delete({ where: { id: existing.id } })
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})
