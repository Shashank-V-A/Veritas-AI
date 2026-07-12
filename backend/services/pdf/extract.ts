import { MAX_CONTENT_LENGTH } from '@veritas/shared'
import { AppError } from '../../utils/errors.js'
import { logger } from '../../utils/logger.js'

const MAX_PDF_BYTES = 10 * 1024 * 1024

/**
 * Extract text from a PDF buffer.
 * Uses `unpdf` — a serverless-safe PDF.js build (no native canvas / DOMMatrix).
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_PDF_BYTES) {
    throw new AppError('PDF must be under 10 MB', 'VALIDATION_ERROR', 400)
  }

  try {
    const { extractText, getDocumentProxy } = await import('unpdf')
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: true })
    const normalized = text.replace(/\s+/g, ' ').trim()

    if (!normalized) {
      throw new AppError(
        'No extractable text found in PDF — try a text-based document',
        'VALIDATION_ERROR',
        400,
      )
    }

    return normalized.slice(0, MAX_CONTENT_LENGTH)
  } catch (error) {
    if (error instanceof AppError) throw error

    logger.warn('PDF extraction failed', {
      error: error instanceof Error ? error.message : String(error),
      bytes: buffer.length,
    })

    throw new AppError(
      'Could not read PDF file — ensure it is a valid text-based PDF',
      'VALIDATION_ERROR',
      400,
    )
  }
}
