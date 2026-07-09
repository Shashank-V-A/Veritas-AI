export const MAX_CONTENT_LENGTH = 50_000
export const DEFAULT_PAGE_LIMIT = 20
export const MAX_PAGE_LIMIT = 100
export const MESH_TIMEOUT_MS = 60_000
export const MESH_MAX_RETRIES = 2

export const SOURCE_TYPES = [
  'article',
  'social',
  'transcript',
  'forward',
  'blog',
  'pdf',
  'raw',
] as const
