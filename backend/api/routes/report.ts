import { Router } from 'express'
import { cacheControl } from '../middleware/cacheControl.js'
import { generateReportPdf } from '../../services/export/pdf.js'
import { reportRepository } from '../../services/report/repository.js'
import { reportIdSchema } from '../../utils/validation.js'

export const reportRouter = Router()

reportRouter.get('/:id/export', async (req, res, next) => {
  try {
    const { id } = reportIdSchema.parse(req.params)
    const record = await reportRepository.findById(id, req.user?.sub)
    const pdfBuffer = await generateReportPdf(record)

    const filename = `${(record.title ?? 'veritas-report').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 60)}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
})

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

reportRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = reportIdSchema.parse(req.params)
    const userId = req.user?.sub
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Sign in required' },
      })
      return
    }

    await reportRepository.deleteById(id, userId)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})
