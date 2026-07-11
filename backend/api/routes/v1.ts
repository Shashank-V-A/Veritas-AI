import { createHash, randomBytes } from 'node:crypto'
import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { runAnalysis } from '../../services/analysis/pipeline.js'
import { syncAnalysisToGraph } from '../../services/graph/neo4j.js'
import { reportRepository } from '../../services/report/repository.js'
import { analyzeRequestSchema, sanitizeContent } from '../../utils/validation.js'
import { requireApiKey } from '../middleware/apiKey.js'

export const v1Router = Router()

v1Router.use(requireApiKey)

v1Router.post('/analyze', async (req, res, next) => {
  try {
    const parsed = analyzeRequestSchema.parse(req.body)
    const content = sanitizeContent(parsed.content)

    const pipeline = await runAnalysis({
      content,
      sourceType: parsed.sourceType,
      title: parsed.title,
    })

    const record = await reportRepository.save({
      content,
      sourceType: parsed.sourceType,
      title: parsed.title,
      category: parsed.category,
      report: pipeline.report,
      meshModel: pipeline.meshModel,
      meshLatencyMs: pipeline.meshLatencyMs,
      userId: req.apiUserId,
    })

    await syncAnalysisToGraph(record.id, record.report)

    res.status(201).json({
      id: record.id,
      report: record.report,
      createdAt: record.createdAt,
      meta: {
        meshModel: pipeline.meshModel,
        meshLatencyMs: pipeline.meshLatencyMs,
      },
    })
  } catch (error) {
    next(error)
  }
})

v1Router.post('/keys', async (req, res, next) => {
  try {
    const userId = req.apiUserId
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Auth required' } })
      return
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.slice(0, 80) : 'API key'
    const rawKey = `vta_${randomBytes(24).toString('base64url')}`
    const keyHash = createHash('sha256').update(rawKey).digest('hex')

    await prisma.apiKey.create({
      data: { userId, name, keyHash },
    })

    res.status(201).json({ key: rawKey, name, message: 'Store this key securely — it will not be shown again.' })
  } catch (error) {
    next(error)
  }
})
