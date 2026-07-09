import { createApp } from './index.js'
import { logger } from '../utils/logger.js'

const PORT = Number(process.env.PORT ?? 3001)

const app = createApp()

app.listen(PORT, () => {
  logger.info(`Veritas API running on http://localhost:${PORT}`)
})
