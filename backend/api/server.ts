import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createApp } from './index.js'
import { getOAuthRedirectUri } from '../services/auth/google.js'
import { logger } from '../utils/logger.js'

config({ path: resolve(import.meta.dirname, '../.env') })

const PORT = Number(process.env.PORT ?? 3001)

const app = createApp()

app.listen(PORT, () => {
  logger.info(`Veritas API running on http://localhost:${PORT}`)
  if (process.env.GOOGLE_CLIENT_ID?.trim()) {
    logger.info(
      `Google OAuth redirect URI (add this in Google Cloud Console): ${getOAuthRedirectUri()}`,
    )
  }
})
