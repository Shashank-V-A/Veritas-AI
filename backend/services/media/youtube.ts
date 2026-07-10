const VIDEO_ID_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(VIDEO_ID_RE)
  return match?.[1] ?? null
}

/** Fetch YouTube captions via timedtext API (no API key required) */
export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  const listUrl = `https://www.youtube.com/watch?v=${videoId}`
  const pageRes = await fetch(listUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!pageRes.ok) throw new Error('Could not load YouTube page')

  const html = await pageRes.text()
  const captionTrackMatch = html.match(/"captionTracks":(\[.*?\])/)
  if (!captionTrackMatch) {
    throw new Error('No captions available for this video')
  }

  let tracks: Array<{ baseUrl: string; languageCode: string }>
  try {
    tracks = JSON.parse(captionTrackMatch[1]) as Array<{
      baseUrl: string
      languageCode: string
    }>
  } catch {
    throw new Error('Could not parse caption tracks')
  }

  const track = tracks.find((t) => t.languageCode.startsWith('en')) ?? tracks[0]
  if (!track?.baseUrl) throw new Error('No caption track URL found')

  const captionRes = await fetch(track.baseUrl, { signal: AbortSignal.timeout(15_000) })
  if (!captionRes.ok) throw new Error('Could not fetch captions')

  const xml = await captionRes.text()
  const lines = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) =>
    decodeXml(m[1]),
  )
  const text = lines.join(' ').replace(/\s+/g, ' ').trim()
  if (!text) throw new Error('Empty transcript')
  return text
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, ' ')
}

export async function extractYouTubeContent(url: string): Promise<{
  content: string
  title: string
  videoId: string
}> {
  const videoId = extractYouTubeVideoId(url)
  if (!videoId) throw new Error('Invalid YouTube URL')

  const content = await fetchYouTubeTranscript(videoId)
  return {
    content,
    title: `YouTube transcript · ${videoId}`,
    videoId,
  }
}
