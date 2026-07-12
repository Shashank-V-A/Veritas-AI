/**
 * YouTube transcript extraction — serverless-safe.
 *
 * Root constraints on Vercel:
 * - YouTube blocks `timedtext` from datacenter IPs (scrapers fail).
 * - Datacenter Webshare lists are also blocked.
 * - Gemini can read public YouTube URLs, but long videos (30–60+ min)
 *   must be processed in short clips or the model returns empty / times out.
 * - Free Gemini keys hit 429 quota — need retries + lighter models.
 *
 * Long videos: the frontend calls `/youtube/transcript/chunk` per clip so each
 * invocation stays under Vercel's 60s cap.
 */
import {
  YouTubeTranscriptApi,
  WebshareProxyConfig,
  RequestBlocked,
  type ProxyConfig,
} from '@hallelx/youtube-transcript'
import {
  YOUTUBE_GEMINI_CHUNK_SEC,
} from '@veritas/shared'
import { AppError } from '../../utils/errors.js'
import { logger } from '../../utils/logger.js'

const VIDEO_ID_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const ANDROID_UA =
  'com.google.android.youtube/19.47.53 (Linux; U; Android 14) gzip'

const TRANSCRIPT_LANGS = ['en', 'en-US', 'en-GB', 'hi', 'a.en', 'en-IN']

/** Max seconds of video to pull via Gemini clips (keeps latency/quota sane). */
const GEMINI_MAX_COVERAGE_SEC = 960 // 16 minutes
const GEMINI_CHUNK_SEC = 480 // 8 minutes per clip (local dev)
const GEMINI_TIMEOUT_MS_VERCEL = 45_000
const GEMINI_TIMEOUT_MS = 50_000
const VERCEL_TRANSCRIPT_DEADLINE_MS = 55_000

export function extractYouTubeVideoId(url: string): string | null {
  const match = url.trim().match(VIDEO_ID_RE)
  return match?.[1] ?? null
}

function buildResidentialProxyConfig(): ProxyConfig | undefined {
  if (process.env.WEBSHARE_USE_ENDPOINT_LIST === 'true') return undefined
  const username = process.env.WEBSHARE_PROXY_USERNAME?.trim()
  const password = process.env.WEBSHARE_PROXY_PASSWORD?.trim()
  if (!username || !password) return undefined
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

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function extractPlayerResponse(html: string): Record<string, unknown> | null {
  const marker = 'var ytInitialPlayerResponse = '
  const start = html.indexOf(marker)
  if (start < 0) return null
  const from = start + marker.length
  let depth = 0
  let end = from
  for (let i = from; i < Math.min(html.length, from + 2_500_000); i++) {
    const ch = html[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }
  try {
    return JSON.parse(html.slice(from, end)) as Record<string, unknown>
  } catch {
    return null
  }
}

async function fetchWatchPage(videoId: string): Promise<{
  html: string
  player: Record<string, unknown> | null
}> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(12_000),
  })
  if (!res.ok) return { html: '', player: null }
  const html = await res.text()
  return { html, player: extractPlayerResponse(html) }
}

function getDurationSeconds(player: Record<string, unknown> | null): number | null {
  const details = player?.videoDetails as { lengthSeconds?: string } | undefined
  const n = Number(details?.lengthSeconds)
  return Number.isFinite(n) && n > 0 ? n : null
}

function getTitleFromPlayer(player: Record<string, unknown> | null): string | null {
  const details = player?.videoDetails as { title?: string } | undefined
  return details?.title?.trim() || null
}

function getCaptionTracks(player: Record<string, unknown> | null): Array<{
  languageCode?: string
  baseUrl?: string
}> {
  const captions = player?.captions as
    | {
        playerCaptionsTracklistRenderer?: {
          captionTracks?: Array<{ languageCode?: string; baseUrl?: string }>
        }
      }
    | undefined
  return captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
}

async function fetchViaWatchPageCaptions(videoId: string): Promise<string | null> {
  try {
    const { player } = await fetchWatchPage(videoId)
    const tracks = getCaptionTracks(player)
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
        headers: { 'User-Agent': BROWSER_UA },
        signal: AbortSignal.timeout(12_000),
      })
      if (!captionRes.ok) continue
      const text = bodyToTranscript(await captionRes.text())
      if (text.length >= 20) {
        logger.info('YouTube transcript via watch-page captions', { videoId, fmt })
        return text.slice(0, 10_000)
      }
    }
  } catch (error) {
    logger.warn('Watch-page caption fetch failed', {
      videoId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
  return null
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
        signal: AbortSignal.timeout(15_000),
      },
    )
    if (!playerRes.ok) return null
    const player = (await playerRes.json()) as Record<string, unknown>
    const tracks = getCaptionTracks(player)
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
        signal: AbortSignal.timeout(12_000),
      })
      if (!captionRes.ok) continue
      const text = bodyToTranscript(await captionRes.text())
      if (text.length >= 20) {
        logger.info('YouTube transcript via ANDROID innertube', { videoId, fmt })
        return text.slice(0, 10_000)
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
  const api = new YouTubeTranscriptApi({
    proxyConfig: buildResidentialProxyConfig(),
  })
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
      return text.length >= 20 ? text.slice(0, 10_000) : null
    } catch {
      const transcript = await api.fetch(videoId, { languages: TRANSCRIPT_LANGS })
      const text = transcript.snippets
        .map((s) => s.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text.length >= 20 ? text.slice(0, 10_000) : null
    }
  } catch (error) {
    logger.warn('Hallelx transcript failed', {
      videoId,
      blocked:
        error instanceof RequestBlocked ||
        (error instanceof Error &&
          /requestblocked|ipblocked|blocked|bot/i.test(
            `${error.constructor.name} ${error.message}`,
          )),
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/** Return the first non-null result from parallel tasks (optionally within a deadline). */
async function firstSuccessful(
  tasks: Array<() => Promise<string | null>>,
  options?: { timeoutMs?: number },
): Promise<string | null> {
  if (tasks.length === 0) return null

  return new Promise((resolve) => {
    let pending = tasks.length
    let settled = false

    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve(value)
    }

    const timer = options?.timeoutMs
      ? setTimeout(() => finish(null), options.timeoutMs)
      : null

    for (const task of tasks) {
      task()
        .then((result) => {
          if (result && result.length >= 20) finish(result)
        })
        .catch(() => {})
        .finally(() => {
          pending--
          if (!settled && pending === 0) finish(null)
        })
    }
  })
}

async function geminiGenerateClip(input: {
  apiKey: string
  model: string
  watchUrl: string
  startSec: number
  endSec: number
  timeoutMs?: number
  maxAttempts?: number
  maxOutputTokens?: number
}): Promise<string | null> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`
  const timeoutMs = input.timeoutMs ?? GEMINI_TIMEOUT_MS
  const maxAttempts = input.maxAttempts ?? 3

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
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
                    'Extract spoken words from this YouTube clip as plain continuous prose.',
                    'Prefer official captions/subtitles when available.',
                    'Include factual claims, numbers, advice, and conclusions that are spoken.',
                    'No titles, timestamps, or commentary.',
                    'If no speech in this clip, return exactly: NO_SPEECH',
                  ].join(' '),
                },
                {
                  fileData: {
                    fileUri: input.watchUrl,
                    mimeType: 'video/*',
                  },
                  videoMetadata: {
                    startOffset: `${input.startSec}s`,
                    endOffset: `${input.endSec}s`,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: input.maxOutputTokens ?? 8192,
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      })

      const raw = await res.text()

      if (res.status === 429 || res.status === 503) {
        logger.warn('Gemini clip rate-limited, retrying', {
          model: input.model,
          status: res.status,
          attempt: attempt + 1,
        })
        await sleep(1500 * (attempt + 1))
        continue
      }

      if (!res.ok) {
        logger.warn('Gemini clip HTTP error', {
          model: input.model,
          status: res.status,
          body: raw.slice(0, 220),
        })
        return null
      }

      const data = JSON.parse(raw) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> }
          finishReason?: string
        }>
      }
      const text = data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('')
        .replace(/\s+/g, ' ')
        .trim()

      if (!text || text === 'NO_SPEECH') return null
      return text
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const timedOut = /abort|timeout/i.test(message)
      logger.warn('Gemini clip request failed', {
        model: input.model,
        attempt: attempt + 1,
        timedOut,
        error: message,
      })
      if (timedOut) return null
      await sleep(1000 * (attempt + 1))
    }
  }

  return null
}

/**
 * Gemini clip transcription for a specific time range.
 * Used for chunked long-video extraction (one clip per serverless call).
 */
async function fetchViaGeminiClip(
  videoId: string,
  startSec: number,
  endSec: number,
): Promise<string | null> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  if (!apiKey) return null

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
  const onVercel = process.env.VERCEL === '1'
  const models = onVercel
    ? ['gemini-flash-latest', 'gemini-2.0-flash-lite']
    : ['gemini-flash-latest', 'gemini-2.0-flash-lite', 'gemini-2.5-flash']

  for (const model of models) {
    const clipText = await geminiGenerateClip({
      apiKey,
      model,
      watchUrl,
      startSec,
      endSec,
      timeoutMs: onVercel ? GEMINI_TIMEOUT_MS_VERCEL : GEMINI_TIMEOUT_MS,
      maxAttempts: onVercel ? 2 : 3,
      maxOutputTokens: onVercel ? 4096 : 8192,
    })
    if (clipText && clipText.length >= 20) {
      logger.info('YouTube Gemini clip ok', {
        videoId,
        model,
        start: startSec,
        end: endSec,
        chars: clipText.length,
      })
      return clipText
    }
  }

  return null
}

/**
 * Root Gemini path: process long videos as short clips (local dev only).
 * On Vercel, use fetchYouTubeTranscriptChunk from the frontend instead.
 */
async function fetchViaGeminiYoutube(videoId: string): Promise<string | null> {
  const onVercel = process.env.VERCEL === '1'
  if (onVercel) {
    return fetchViaGeminiClip(videoId, 0, YOUTUBE_GEMINI_CHUNK_SEC)
  }

  let duration: number | null = null
  try {
    const { player } = await fetchWatchPage(videoId)
    duration = getDurationSeconds(player)
  } catch {
    /* duration optional */
  }

  const coverage = Math.min(duration ?? GEMINI_CHUNK_SEC, GEMINI_MAX_COVERAGE_SEC)
  const clips: Array<{ start: number; end: number }> = []
  for (let start = 0; start < coverage; start += GEMINI_CHUNK_SEC) {
    clips.push({
      start,
      end: Math.min(start + GEMINI_CHUNK_SEC, coverage),
    })
  }
  if (clips.length === 0) clips.push({ start: 0, end: GEMINI_CHUNK_SEC })

  const parts: string[] = []
  for (const clip of clips) {
    const clipText = await fetchViaGeminiClip(videoId, clip.start, clip.end)
    if (clipText) parts.push(clipText)
  }

  const merged = parts.join('\n\n').replace(/\s+/g, ' ').trim()
  if (merged.length < 20) return null
  return merged.slice(0, 10_000)
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
      signal: AbortSignal.timeout(25_000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { content?: string; text?: string }
    const text = (data.content ?? data.text ?? '').replace(/\s+/g, ' ').trim()
    return text.length >= 20 ? text.slice(0, 10_000) : null
  } catch (error) {
    logger.warn('Supadata transcript fallback failed', {
      videoId,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  const onVercel = process.env.VERCEL === '1'

  let durationSec: number | null = null
  try {
    const { player } = await fetchWatchPage(videoId)
    durationSec = getDurationSeconds(player)
  } catch {
    /* optional */
  }

  const isLongVideo =
    durationSec != null && durationSec > YOUTUBE_GEMINI_CHUNK_SEC

  // Long videos: captions return the full transcript in one fast call.
  // Gemini only covers the first clip — skip it here so the frontend can chunk.
  const captionAttempts = [
    () => fetchViaWatchPageCaptions(videoId),
    () => fetchViaInnertubeAndroid(videoId),
    () => fetchViaHallelx(videoId),
    () => fetchViaSupadata(videoId),
  ]
  const shortVideoAttempts = [
    ...captionAttempts,
    () => fetchViaGeminiYoutube(videoId),
  ]

  const attempts = isLongVideo ? captionAttempts : shortVideoAttempts

  const text = onVercel
    ? await firstSuccessful(attempts, { timeoutMs: VERCEL_TRANSCRIPT_DEADLINE_MS })
    : await firstSuccessful(attempts)

  if (text && text.length >= 20) return text

  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
  )

  throw new AppError(
    hasGemini
      ? 'Could not extract a transcript from this video (no captions found, and speech extraction failed). For long videos we retry in parts automatically — if this persists, wait a minute and retry, or paste the transcript as text.'
      : 'YouTube blocks caption downloads from cloud servers. Add GEMINI_API_KEY from https://aistudio.google.com/apikey, or paste the transcript as text.',
    'MESH_ERROR',
    502,
  )
}

export interface YouTubeVideoMeta {
  videoId: string
  title: string | null
  durationSec: number | null
}

export async function getYouTubeVideoMeta(url: string): Promise<YouTubeVideoMeta> {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) {
    throw new AppError(
      'Invalid YouTube URL. Use a link like https://www.youtube.com/watch?v=…',
      'VALIDATION_ERROR',
      400,
    )
  }

  const { player } = await fetchWatchPage(videoId)
  return {
    videoId,
    title: getTitleFromPlayer(player),
    durationSec: getDurationSeconds(player),
  }
}

/** Transcribe one time range — safe for Vercel's 60s function limit. */
export async function fetchYouTubeTranscriptChunk(
  videoId: string,
  startSec: number,
  endSec: number,
): Promise<string> {
  if (endSec <= startSec) {
    throw new AppError('Invalid clip range', 'VALIDATION_ERROR', 400)
  }
  if (endSec - startSec > YOUTUBE_GEMINI_CHUNK_SEC + 30) {
    throw new AppError(
      `Clip too long (max ${YOUTUBE_GEMINI_CHUNK_SEC}s per request)`,
      'VALIDATION_ERROR',
      400,
    )
  }

  const text = await fetchViaGeminiClip(videoId, startSec, endSec)
  if (text && text.length >= 20) return text.slice(0, 10_000)

  throw new AppError(
    'Could not extract speech from this clip (Gemini quota/busy or no speech in range). Retry in a minute.',
    'MESH_ERROR',
    502,
  )
}

async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  try {
    const { html, player } = await fetchWatchPage(videoId)
    const fromPlayer = getTitleFromPlayer(player)
    if (fromPlayer) return fromPlayer
    const og = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
    if (og?.[1]) return decodeHtml(og[1])
    const titleTag = html.match(/<title>([^<]+)<\/title>/i)
    if (titleTag?.[1]) {
      return decodeHtml(titleTag[1].replace(/\s*-\s*YouTube\s*$/i, '').trim())
    }
  } catch {
    /* title optional */
  }
  return null
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
