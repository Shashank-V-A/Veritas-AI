import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createApp } from './index.js'
import { logger } from '../utils/logger.js'

config({ path: resolve(import.meta.dirname, '../.env') })

const PORT = Number(process.env.PORT ?? 3001)

const app = createApp()

app.listen(PORT, () => {
  logger.info(`Veritas API running on http://localhost:${PORT}`)
})
