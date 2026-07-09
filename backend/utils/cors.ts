import type { CorsOptions } from 'cors'

export function getCorsOptions(): CorsOptions {
  if (process.env.NODE_ENV !== 'production') {
    return { origin: true, credentials: true }
  }

  const origins = new Set<string>()

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`)
  }
  if (process.env.VERCEL_BRANCH_URL) {
    origins.add(`https://${process.env.VERCEL_BRANCH_URL}`)
  }
  if (process.env.FRONTEND_URL) {
    origins.add(process.env.FRONTEND_URL)
  }

  if (origins.size === 0) {
    return { origin: true }
  }

  return {
    origin: [...origins],
    credentials: true,
  }
}
