import { Router } from 'express'
import multer from 'multer'
import { runAnalysis } from '../../services/analysis/pipeline.js'
import { extractTextFromPdf } from '../../services/pdf/extract.js'
import { extractFromUrl } from '../../services/url/extract.js'
import { reportRepository } from '../../services/report/repository.js'
import {
  analyzeRequestSchema,
  compareRequestSchema,
  sanitizeContent,
  urlAnalyzeRequestSchema,
} from '../../utils/validation.js'
import { AppError } from '../../utils/errors.js'

export const analyzeRouter = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
      return
    }
    cb(new AppError('Only PDF files are allowed', 'VALIDATION_ERROR', 400))
  },
})

const batchUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
      return
    }
    cb(new AppError('Only PDF files are allowed', 'VALIDATION_ERROR', 400))
  },
})

function buildAnalyzeResponse(
  record: Awaited<ReturnType<typeof reportRepository.save>>,
  meta: { meshModel: string; meshLatencyMs: number },
) {
  return {
    id: record.id,
    report: record.report,
    createdAt: record.createdAt,
    meta: {
      meshModel: meta.meshModel,
      meshLatencyMs: meta.meshLatencyMs,
    },
  }
}

analyzeRouter.post('/', async (req, res, next) => {
  try {
    const parsed = analyzeRequestSchema.parse(req.body)
    const content = sanitizeContent(parsed.content)

    const pipeline = await runAnalysis({
      content,
      sourceType: parsed.sourceType,
      title: parsed.title,
      compareContent: parsed.compareContent
        ? sanitizeContent(parsed.compareContent)
        : undefined,
    })

    const record = await reportRepository.save({
      content,
      sourceType: parsed.sourceType,
      title: parsed.title,
      category: parsed.category,
      compareContent: parsed.compareContent
        ? sanitizeContent(parsed.compareContent)
        : undefined,
      report: pipeline.report,
      meshModel: pipeline.meshModel,
      meshLatencyMs: pipeline.meshLatencyMs,
      userId: req.user?.sub,
    })

    res.status(201).json(buildAnalyzeResponse(record, pipeline))
  } catch (error) {
    next(error)
  }
})

analyzeRouter.post('/compare', async (req, res, next) => {
  try {
    const parsed = compareRequestSchema.parse(req.body)
    const content = sanitizeContent(parsed.content)
    const compareContent = sanitizeContent(parsed.compareContent)

    const pipeline = await runAnalysis({
      content,
      sourceType: parsed.sourceType,
      title: parsed.title,
      compareContent,
    })

    const record = await reportRepository.save({
      content,
      sourceType: parsed.sourceType,
      title: parsed.title,
      category: parsed.category,
      compareContent,
      report: pipeline.report,
      meshModel: pipeline.meshModel,
      meshLatencyMs: pipeline.meshLatencyMs,
      userId: req.user?.sub,
    })

    res.status(201).json(buildAnalyzeResponse(record, pipeline))
  } catch (error) {
    next(error)
  }
})

analyzeRouter.post('/url', async (req, res, next) => {
  try {
    const parsed = urlAnalyzeRequestSchema.parse(req.body)
    const extracted = await extractFromUrl(parsed.url)

    const pipeline = await runAnalysis({
      content: extracted.content,
      sourceType: 'article',
      title: parsed.title ?? extracted.title ?? extracted.domain,
    })

    const record = await reportRepository.save({
      content: extracted.content,
      sourceType: 'article',
      title: parsed.title ?? extracted.title ?? extracted.domain,
      category: parsed.category,
      report: pipeline.report,
      meshModel: pipeline.meshModel,
      meshLatencyMs: pipeline.meshLatencyMs,
      userId: req.user?.sub,
    })

    res.status(201).json(buildAnalyzeResponse(record, pipeline))
  } catch (error) {
    next(error)
  }
})

analyzeRouter.post('/pdf', upload.single('pdf'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('PDF file is required', 'VALIDATION_ERROR', 400)
    }

    const content = await extractTextFromPdf(req.file.buffer)
    const title =
      typeof req.body.title === 'string' && req.body.title.trim()
        ? req.body.title.trim().slice(0, 200)
        : req.file.originalname.replace(/\.pdf$/i, '')

    const pipeline = await runAnalysis({
      content,
      sourceType: 'pdf',
      title,
    })

    const record = await reportRepository.save({
      content,
      sourceType: 'pdf',
      title,
      report: pipeline.report,
      meshModel: pipeline.meshModel,
      meshLatencyMs: pipeline.meshLatencyMs,
      userId: req.user?.sub,
    })

    res.status(201).json(buildAnalyzeResponse(record, pipeline))
  } catch (error) {
    next(error)
  }
})

analyzeRouter.post('/batch', batchUpload.array('pdfs', 5), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined

    if (!files || files.length === 0) {
      throw new AppError('At least one PDF file is required', 'VALIDATION_ERROR', 400)
    }

    if (files.length > 5) {
      throw new AppError('Maximum 5 PDF files allowed', 'VALIDATION_ERROR', 400)
    }

    const results = []

    for (const file of files) {
      const content = await extractTextFromPdf(file.buffer)
      const title = file.originalname.replace(/\.pdf$/i, '')

      const pipeline = await runAnalysis({
        content,
        sourceType: 'pdf',
        title,
      })

      const record = await reportRepository.save({
        content,
        sourceType: 'pdf',
        title,
        report: pipeline.report,
        meshModel: pipeline.meshModel,
        meshLatencyMs: pipeline.meshLatencyMs,
        userId: req.user?.sub,
      })

      results.push(buildAnalyzeResponse(record, pipeline))
    }

    res.status(201).json({ results })
  } catch (error) {
    next(error)
  }
})
