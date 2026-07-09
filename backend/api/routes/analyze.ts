import { Router } from 'express'
import { runAnalysis } from '../../services/analysis/pipeline.js'
import { reportRepository } from '../../services/report/repository.js'
import {
  analyzeRequestSchema,
  sanitizeContent,
} from '../../utils/validation.js'

export const analyzeRouter = Router()

analyzeRouter.post('/', async (req, res, next) => {
  try {
    const parsed = analyzeRequestSchema.parse(req.body)
    const content = sanitizeContent(parsed.content)

    const report = await runAnalysis({
      content,
      sourceType: parsed.sourceType,
      title: parsed.title,
    })

    const record = await reportRepository.save({
      content,
      sourceType: parsed.sourceType,
      title: parsed.title,
      report,
    })

    res.status(201).json({
      id: record.id,
      report: record.report,
      createdAt: record.createdAt,
    })
  } catch (error) {
    next(error)
  }
})
