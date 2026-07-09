/**
 * Vercel serverless entry point.
 * Re-exports the Express app — all /api/* traffic routes here.
 */
import app from '../backend/api/index.js'

export default app
