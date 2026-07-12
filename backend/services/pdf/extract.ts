import { AppError } from '../../utils/errors.js'

const MAX_PDF_BYTES = 10 * 1024 * 1024

/**
 * Lazy-load pdf-parse. It pulls in pdfjs-dist, which touches DOMMatrix at
 * module init and crashes Vercel serverless cold starts if imported eagerly.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_PDF_BYTES) {
    throw new AppError('PDF must be under 10 MB', 'VALIDATION_ERROR', 400)
  }

  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()
    const text = result.text?.replace(/\s+/g, ' ').trim()

    if (!text) {
      throw new AppError(
        'No extractable text found in PDF — try a text-based document',
        'VALIDATION_ERROR',
        400,
      )
    }

    return text
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('Could not read PDF file', 'VALIDATION_ERROR', 400)
  } finally {
    await parser.destroy()
  }
}
