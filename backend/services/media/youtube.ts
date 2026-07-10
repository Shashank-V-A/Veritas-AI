import { YouTubeTranscriptApi } from '@hallelx/youtube-transcript'
import { AppError } from '../../utils/errors.js'

const VIDEO_ID_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export function extractYouTubeVideoId(url: string): string | null {
  const match = url.trim().match(VIDEO_ID_RE)
  return match?.[1] ?? null
}

/** Fetch captions via YouTube innertube player API (more reliable than timedtext scrape). */
export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  const api = new YouTubeTranscriptApi()

  try {
    const transcript = await api.fetch(videoId, {
      languages: ['en', 'en-US', 'en-GB'],
    })
    const text = transcript.snippets
      .map((s) => s.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text) {
      throw new AppError(
        'This video returned an empty transcript. Try another video or paste the transcript as text.',
        'VALIDATION_ERROR',
        422,
      )
    }

    return text
  } catch (error) {
    if (error instanceof AppError) throw error

    const name = error instanceof Error ? error.constructor.name : ''
    const message = error instanceof Error ? error.message : String(error)
    const combined = `${name} ${message}`.toLowerCase()

    if (
      combined.includes('transcriptsdisabled') ||
      combined.includes('no transcript') ||
      combined.includes('notranscriptfound')
    ) {
      throw new AppError(
        'No captions are available for this YouTube video. Enable captions on the video, or paste the transcript as text.',
        'VALIDATION_ERROR',
        422,
      )
    }

    if (
      combined.includes('videounavailable') ||
      combined.includes('videounplayable') ||
      combined.includes('invalidvideoid') ||
      combined.includes('age restricted') ||
      combined.includes('agerestricted')
    ) {
      throw new AppError(
        'This YouTube video cannot be accessed (private, age-restricted, or unavailable).',
        'VALIDATION_ERROR',
        422,
      )
    }

    if (
      combined.includes('requestblocked') ||
      combined.includes('ipblocked') ||
      combined.includes('blocked')
    ) {
      throw new AppError(
        'YouTube blocked transcript access from this server. Try again later, or paste the transcript as text.',
        'MESH_ERROR',
        502,
      )
    }

    throw new AppError(
      `Could not fetch YouTube transcript: ${message}`,
      'MESH_ERROR',
      502,
    )
  }
}

async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const og = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
    if (og?.[1]) return decodeHtml(og[1])
    const titleTag = html.match(/<title>([^<]+)<\/title>/i)
    if (titleTag?.[1]) {
      return decodeHtml(titleTag[1].replace(/\s*-\s*YouTube\s*$/i, '').trim())
    }
  } catch {
    /* title is optional */
  }
  return null
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export async function extractYouTubeContent(url: string): Promise<{
  content: string
  title: string
  videoId: string
}> {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) {
    throw new AppError(
      'Invalid YouTube URL. Use a link like https://www.youtube.com/watch?v=…',
      'VALIDATION_ERROR',
      400,
    )
  }

  const [content, pageTitle] = await Promise.all([
    fetchYouTubeTranscript(videoId),
    fetchYouTubeTitle(videoId),
  ])

  return {
    content,
    title: pageTitle ?? `YouTube transcript · ${videoId}`,
    videoId,
  }
}
