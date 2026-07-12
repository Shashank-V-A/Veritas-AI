export const MAX_CONTENT_LENGTH = 50_000
export const DEFAULT_PAGE_LIMIT = 20
export const MAX_PAGE_LIMIT = 100
export const MESH_TIMEOUT_MS = 60_000
export const MESH_MAX_RETRIES = 2

/** Gemini clip size on Vercel (each chunk is a separate serverless invocation). */
export const YOUTUBE_GEMINI_CHUNK_SEC = 120
/** Max video length we'll transcribe via chunked Gemini (1 hour). */
export const YOUTUBE_MAX_DURATION_SEC = 3600

export const SOURCE_TYPES = [
  'article',
  'social',
  'transcript',
  'forward',
  'blog',
  'pdf',
  'raw',
] as const
