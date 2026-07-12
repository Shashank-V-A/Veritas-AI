/**
 * YouTube transcript extraction with serverless-friendly fallbacks.
 *
 * Why Vercel fails: YouTube blocks `timedtext` from datacenter IPs.
 * Datacenter Webshare endpoint lists often make this worse.
 *
 * Strategy (in order):
 * 1. Innertube ANDROID → caption track → timedtext (no proxy)
 * 2. @hallelx/youtube-transcript without proxy (+ optional residential Webshare)
 * 3. Gemini YouTube URL understanding (free AI Studio key) — works from any IP
 * 4. Supadata (optional free tier key)
 */
import {
  YouTubeTranscriptApi,
  WebshareProxyConfig,
  RequestBlocked,
  type ProxyConfig,
} from '@hallelx/youtube-transcript'
import { AppError } from '../../utils/errors.js'
import { logger } from '../../utils/logger.js'

const VIDEO_ID_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const ANDROID_UA =
  'com.google.android.youtube/19.47.53 (Linux; U; Android 14) gzip'

const TRANSCRIPT_LANGS = ['en', 'en-US', 'en-GB', 'hi', 'a.en', 'en-IN']

export function extractYouTubeVideoId(url: string): string | null {
  const match = url.trim().match(VIDEO_ID_RE)
  return match?.[1] ?? null
}

function buildResidentialProxyConfig(): ProxyConfig | undefined {
  // Only use Webshare *rotating residential* gateway — NOT ip:port datacenter lists.
  // Datacenter endpoint lists are also blocked by YouTube and can force IpBlocked.
  if (process.env.WEBSHARE_USE_ENDPOINT_LIST === 'true') {
    return undefined
  }
  const username = process.env.WEBSHARE_PROXY_USERNAME?.trim()
  const password = process.env.WEBSHARE_PROXY_PASSWORD?.trim()
  if (!username || !password) return undefined
  // If only a datacenter list was provided earlier, still try rotating gateway
  // with the same username/password (works for residential plans).
  return new WebshareProxyConfig({
    proxyUsername: username,
    proxyPassword: password,
  })
}

function parseTimedTextXml(xml: string): string {
  const chunks: string[] = []
  const re = /<p[^>]*>([\s\S]*?)<\/p>|<text[^>]*>([\s\S]*?)<\/text>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) {
    const raw = match[1] ?? match[2] ?? ''
    const text = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
    if (text) chunks.push(text)
  }
  return chunks.join(' ').replace(/\s+/g, ' ').trim()
}

function parseJson3Captions(body: string): string {
  try {
    const data = JSON.parse(body) as {
      events?: Array<{ segs?: Array<{ utf8?: string }> }>
    }
    const parts: string[] = []
    for (const event of data.events ?? []) {
      for (const seg of event.segs ?? []) {
        if (seg.utf8 && seg.utf8 !== '\n') parts.push(seg.utf8)
      }
    }
    return parts.join('').replace(/\s+/g, ' ').trim()
  } catch {
    return ''
  }
}

function bodyToTranscript(body: string): string {
  const trimmed = body.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('{')) {
    return parseJson3Captions(trimmed) || parseTimedTextXml(trimmed)
  }
  return parseTimedTextXml(trimmed)
}

async function fetchViaInnertubeAndroid(videoId: string): Promise<string | null> {
  try {
    const playerRes = await fetch(
      'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': ANDROID_UA,
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '19.47.53',
              androidSdkVersion: 34,
              hl: 'en',
              gl: 'US',
            },
          },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        }),
        signal: AbortSignal.timeout(20_000),
      },
    )
    if (!playerRes.ok) return null
    const player = (await playerRes.json()) as {
      captions?: {
        playerCaptionsTracklistRenderer?: {
          captionTracks?: Array<{
            baseUrl?: string
            languageCode?: string
          }>
        }
      }
    }
    const tracks =
      player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
    if (tracks.length === 0) return null

    const preferred =
      tracks.find((t) =>
        TRANSCRIPT_LANGS.some((l) =>
          (t.languageCode ?? '').toLowerCase().startsWith(l.split('-')[0]!),
        ),
      ) ?? tracks[0]

    const baseUrl = preferred?.baseUrl
    if (!baseUrl) return null

    for (const fmt of ['json3', 'srv3', '']) {
      const url =
        fmt === ''
          ? baseUrl
          : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}fmt=${fmt}`
      const captionRes = await fetch(url, {
        headers: { 'User-Agent': ANDROID_UA },
        signal: AbortSignal.timeout(18_000),
      })
      if (!captionRes.ok) continue
      const text = bodyToTranscript(await captionRes.text())
      if (text.length >= 20) {
        logger.info('YouTube transcript via ANDROID innertube', { videoId, fmt })
        return text
      }
    }
  } catch (error) {
    logger.warn('ANDROID innertube transcript failed', {
      videoId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
  return null
}

async function fetchViaHallelx(videoId: string): Promise<string | null> {
  const proxyConfig = buildResidentialProxyConfig()
  const api = new YouTubeTranscriptApi({ proxyConfig })

  try {
    try {
      const list = await api.list(videoId)
      let track
      try {
        track = list.findTranscript(TRANSCRIPT_LANGS)
      } catch {
        track = [...list][0]
      }
      if (!track) return null
      const fetched = await track.fetch()
      const text = fetched.snippets
        .map((s) => s.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text.length >= 20 ? text : null
    } catch {
      const transcript = await api.fetch(videoId, { languages: TRANSCRIPT_LANGS })
      const text = transcript.snippets
        .map((s) => s.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text.length >= 20 ? text : null
    }
  } catch (error) {
    const blocked =
      error instanceof RequestBlocked ||
      (error instanceof Error &&
        /requestblocked|ipblocked|blocked|bot/i.test(
          `${error.constructor.name} ${error.message}`,
        ))
    logger.warn('Hallelx transcript failed', {
      videoId,
      blocked,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Free path: Google AI Studio / Gemini can read public YouTube URLs directly
 * (no timedtext scrape). Create a key at https://aistudio.google.com/apikey
 */
async function fetchViaGeminiYoutube(videoId: string): Promise<string | null> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  if (!apiKey) return null

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
  // Prefer models that work for new AI Studio keys; keep the list short so we
  // stay under Vercel's 60s function budget (transcript + Mesh analysis).
  const models = ['gemini-flash-latest', 'gemini-3.5-flash']

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: [
                    'From this YouTube video, extract the spoken words as plain text for a credibility investigation.',
                    'Prefer the official captions/subtitles when available.',
                    'If the video is long, include the full intro plus every factual claim, statistic, accusation, and conclusion that is spoken — continuous prose, not a bullet summary.',
                    'Hard limit: about 9000 characters. Do not add commentary, titles, or timestamps.',
                    'If there is no speech, return exactly: NO_SPEECH',
                  ].join(' '),
                },
                {
                  fileData: {
                    fileUri: watchUrl,
                    mimeType: 'video/*',
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
        // Leave headroom for Mesh analysis inside the same or follow-up request.
        signal: AbortSignal.timeout(45_000),
      })

      const raw = await res.text()
      if (!res.ok) {
        logger.warn('Gemini YouTube transcript HTTP error', {
          model,
          status: res.status,
          body: raw.slice(0, 200),
        })
        continue
      }

      const data = JSON.parse(raw) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> }
        }>
      }
      const text = data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim()

      if (!text || text === 'NO_SPEECH') continue
      if (text.length < 20) continue

      logger.info('YouTube transcript via Gemini', { videoId, model })
      return text.slice(0, 10_000)
    } catch (error) {
      logger.warn('Gemini YouTube transcript failed', {
        videoId,
        model,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return null
}

async function fetchViaSupadata(videoId: string): Promise<string | null> {
  const apiKey = process.env.SUPADATA_API_KEY?.trim()
  if (!apiKey) return null

  try {
    const url = new URL('https://api.supadata.ai/v1/transcript')
    url.searchParams.set('url', `https://www.youtube.com/watch?v=${videoId}`)
    url.searchParams.set('text', 'true')
    url.searchParams.set('mode', 'native')

    const res = await fetch(url, {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { content?: string; text?: string }
    const text = (data.content ?? data.text ?? '').replace(/\s+/g, ' ').trim()
    return text.length >= 20 ? text : null
  } catch (error) {
    logger.warn('Supadata transcript fallback failed', {
      videoId,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  // On Vercel, timedtext scrapes almost always fail (datacenter IP block) and
  // burn the 60s budget before Gemini/Mesh can finish. Skip straight to Gemini.
  const onVercel = process.env.VERCEL === '1'
  const attempts = onVercel
    ? [() => fetchViaGeminiYoutube(videoId), () => fetchViaSupadata(videoId)]
    : [
        () => fetchViaInnertubeAndroid(videoId),
        () => fetchViaHallelx(videoId),
        () => fetchViaGeminiYoutube(videoId),
        () => fetchViaSupadata(videoId),
      ]

  for (const attempt of attempts) {
    const text = await attempt()
    if (text && text.length >= 20) return text
  }

  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
  )

  throw new AppError(
    hasGemini
      ? 'Could not fetch captions for this YouTube video (model busy or video unavailable). Try again in a moment, use a shorter public video, or paste the transcript as text.'
      : 'YouTube blocks caption downloads from cloud servers. Free fix: add GEMINI_API_KEY from https://aistudio.google.com/apikey (no credit card), or paste the transcript as text.',
    'MESH_ERROR',
    502,
  )
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
