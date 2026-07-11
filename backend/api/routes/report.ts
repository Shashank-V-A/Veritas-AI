import { Router } from 'express'
import { cacheControl } from '../middleware/cacheControl.js'
import { generateReportMarkdown } from '../../services/export/markdown.js'
import { generateReportPdf } from '../../services/export/pdf.js'
import { deleteAnalysisFromGraph } from '../../services/graph/neo4j.js'
import { reportRepository } from '../../services/report/repository.js'
import { reportIdSchema } from '../../utils/validation.js'

export const reportRouter = Router()

function getPublicBaseUrl(req: import('express').Request): string {
  const configured = process.env.PUBLIC_APP_URL?.replace(/\/$/, '')
  if (configured) return configured

  const proto = (req.headers['x-forwarded-proto'] as string) ?? req.protocol
  const host = req.get('host') ?? 'localhost'
  return `${proto}://${host}`
}

reportRouter.post('/:id/share', async (req, res, next) => {
  try {
    const { id } = reportIdSchema.parse(req.params)
    const userId = req.user?.sub
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Sign in required' },
      })
      return
    }

    const share = await reportRepository.enableShare(id, userId, getPublicBaseUrl(req))
    res.json(share)
  } catch (error) {
    next(error)
  }
})

reportRouter.post('/:id/reanalyze', async (req, res, next) => {
  try {
    const { id } = reportIdSchema.parse(req.params)
    const userId = req.user?.sub
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Sign in required' },
      })
      return
    }

    const record = await reportRepository.reanalyze(id, userId)
    res.status(201).json({
      id: record.id,
      report: record.report,
      createdAt: record.createdAt,
      previousTrustScore: record.previousTrustScore,
      previousVerdict: record.previousVerdict,
      meta: {
        meshModel: record.meshModel,
        meshLatencyMs: record.meshLatencyMs,
      },
    })
  } catch (error) {
    next(error)
  }
})

reportRouter.get('/:id/export/markdown', async (req, res, next) => {
  try {
    const { id } = reportIdSchema.parse(req.params)
    const record = await reportRepository.findById(id, req.user?.sub)
    const markdown = generateReportMarkdown(record)

    const filename = `${(record.title ?? 'veritas-report').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 60)}.md`

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(markdown)
  } catch (error) {
    next(error)
  }
})

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
      category: record.category,
      parentId: record.parentId,
      previousTrustScore: record.previousTrustScore,
      previousVerdict: record.previousVerdict,
      meshModel: record.meshModel,
      meshLatencyMs: record.meshLatencyMs,
      shareToken: record.shareToken,
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
    // Keep Neo4j constellation in sync with deleted case files
    await deleteAnalysisFromGraph(id)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})
