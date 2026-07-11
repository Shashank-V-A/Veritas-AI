import { createMeshClient } from '../mesh/client.js'
import { AppError } from '../../utils/errors.js'
import { logger } from '../../utils/logger.js'

const OCR_PROMPT = `You are an OCR and meme-text extractor for a credibility investigation desk.
Extract ALL readable text from this image (memes, screenshots, posters, WhatsApp forwards, social posts).

Rules:
- Preserve wording, spelling, and line breaks where useful
- Include captions, overlays, watermarks, and UI chrome text if claim-relevant
- If the image has little or no text, say so clearly
- Do NOT analyze credibility yet — only extract text
- Return plain text only (no markdown fences)`

function toDataUrl(buffer: Buffer, mimeType: string): string {
  const safeMime = mimeType.startsWith('image/') ? mimeType : 'image/jpeg'
  return `data:${safeMime};base64,${buffer.toString('base64')}`
}

/**
 * Extract visible text from an uploaded image via Mesh vision (Gemini multimodal).
 */
export async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string,
  originalName?: string,
): Promise<{ text: string; model: string }> {
  if (buffer.length === 0) {
    throw new AppError('Image file is empty', 'VALIDATION_ERROR', 400)
  }

  const client = createMeshClient()
  const dataUrl = toDataUrl(buffer, mimeType)

  logger.info('Starting image OCR via Mesh vision', {
    bytes: buffer.length,
    mimeType,
    name: originalName,
  })

  const result = await client.complete({
    temperature: 0.1,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: OCR_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  })

  const text = result.content.trim()
  if (!text || text.length < 8) {
    throw new AppError(
      'No readable text found in this image — try a clearer screenshot or paste the text instead',
      'VALIDATION_ERROR',
      400,
    )
  }

  return { text, model: result.model }
}
