import { Router } from 'express'
import { runAnalysis } from '../../services/analysis/pipeline.js'
import { reportRepository } from '../../services/report/repository.js'
import {
  guestAnalyzeRequestSchema,
  sanitizeContent,
} from '../../utils/validation.js'

export const guestAnalyzeRouter = Router()

const SAMPLE_CONTENT =
  'BREAKING: Doctors are HIDING this! Drinking warm lemon water every morning cures ALL chronic diseases within 7 days. Big Pharma doesn\'t want you to know. Share before they delete this!!!'

const SAMPLE_TITLE = 'Viral health forward — lemon water cure'

guestAnalyzeRouter.post('/', async (req, res, next) => {
  try {
    const parsed = guestAnalyzeRequestSchema.parse(req.body)
    const content = parsed.content
      ? sanitizeContent(parsed.content)
      : SAMPLE_CONTENT
    const title = parsed.title ?? (parsed.content ? undefined : SAMPLE_TITLE)

    const pipeline = await runAnalysis({
      content,
      sourceType: parsed.sourceType,
      title,
    })

    const record = await reportRepository.save({
      content,
      sourceType: parsed.sourceType,
      title,
      report: pipeline.report,
      meshModel: pipeline.meshModel,
      meshLatencyMs: pipeline.meshLatencyMs,
      isGuest: true,
    })

    res.status(201).json({
      id: record.id,
      report: record.report,
      createdAt: record.createdAt,
      shareToken: record.shareToken,
      meta: {
        meshModel: pipeline.meshModel,
        meshLatencyMs: pipeline.meshLatencyMs,
      },
    })
  } catch (error) {
    next(error)
  }
})
