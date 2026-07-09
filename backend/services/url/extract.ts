import { MAX_CONTENT_LENGTH } from '@veritas/shared'
import { AppError } from '../../utils/errors.js'

const FETCH_TIMEOUT_MS = 15_000
const MAX_HTML_BYTES = 2 * 1024 * 1024

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
])

function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!match) return false

  const [, a, b] = match.map(Number)
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

export function validateUrl(rawUrl: string): URL {
  let parsed: URL

  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new AppError('Invalid URL', 'VALIDATION_ERROR', 400)
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new AppError('Only HTTP and HTTPS URLs are supported', 'VALIDATION_ERROR', 400)
  }

  const hostname = parsed.hostname.toLowerCase()

  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    isPrivateIpv4(hostname)
  ) {
    throw new AppError('URL host is not allowed', 'VALIDATION_ERROR', 400)
  }

  return parsed
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
}

function stripHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')

  const text = withoutScripts
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/(div|section|article|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')

  return decodeHtmlEntities(text)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function extractTitle(html: string): string | undefined {
  const match =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ??
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)

  if (!match?.[1]) return undefined

  return decodeHtmlEntities(match[1].replace(/\s+/g, ' ').trim()).slice(0, 200)
}

export interface UrlExtractResult {
  url: string
  domain: string
  title?: string
  content: string
}

export async function extractFromUrl(rawUrl: string): Promise<UrlExtractResult> {
  const parsed = validateUrl(rawUrl)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'VeritasAI/1.0 (+https://veritas.ai)',
      },
    })

    if (!response.ok) {
      throw new AppError(
        `Failed to fetch URL (HTTP ${response.status})`,
        'VALIDATION_ERROR',
        400,
      )
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new AppError('URL did not return HTML content', 'VALIDATION_ERROR', 400)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new AppError('Failed to read URL response', 'VALIDATION_ERROR', 400)
    }

    const chunks: Uint8Array[] = []
    let totalBytes = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      totalBytes += value.byteLength
      if (totalBytes > MAX_HTML_BYTES) {
        throw new AppError('URL content is too large', 'VALIDATION_ERROR', 400)
      }

      chunks.push(value)
    }

    const html = new TextDecoder('utf-8', { fatal: false }).decode(
      Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))),
    )

    const title = extractTitle(html)
    const content = stripHtml(html).slice(0, MAX_CONTENT_LENGTH)

    if (!content || content.length < 50) {
      throw new AppError(
        'Could not extract enough text from URL',
        'VALIDATION_ERROR',
        400,
      )
    }

    return {
      url: parsed.toString(),
      domain: parsed.hostname,
      title,
      content,
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError('URL fetch timed out', 'VALIDATION_ERROR', 408)
    }

    throw new AppError('Failed to fetch URL', 'VALIDATION_ERROR', 400)
  } finally {
    clearTimeout(timeout)
  }
}
