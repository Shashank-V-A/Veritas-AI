import { Router } from 'express'
import multer from 'multer'
import { runAnalysis } from '../../services/analysis/pipeline.js'
import { extractTextFromPdf } from '../../services/pdf/extract.js'
import { reportRepository } from '../../services/report/repository.js'
import {
  analyzeRequestSchema,
  sanitizeContent,
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
      userId: req.user?.sub,
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

    const report = await runAnalysis({
      content,
      sourceType: 'pdf',
      title,
    })

    const record = await reportRepository.save({
      content,
      sourceType: 'pdf',
      title,
      report,
      userId: req.user?.sub,
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
