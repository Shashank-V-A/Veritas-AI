/**
 * Vercel serverless entry — load the Express app via dynamic import.
 *
 * The backend package is ESM (`"type": "module"`). Vercel's Node launcher
 * often wraps TypeScript handlers as CommonJS, so a static
 * `import app from '../backend/...'` becomes `require()` and throws
 * ERR_REQUIRE_ESM. Dynamic `import()` works from both CJS and ESM.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

type ExpressApp = {
  (req: IncomingMessage, res: ServerResponse): void
}

let app: ExpressApp | undefined
let loading: Promise<ExpressApp> | undefined

async function loadApp(): Promise<ExpressApp> {
  if (app) return app
  if (!loading) {
    loading = import('../backend/api/index.js').then((mod) => {
      app = mod.default as ExpressApp
      return app
    })
  }
  return loading
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const expressApp = await loadApp()
  expressApp(req, res)
}
