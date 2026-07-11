export const APP_NAME = 'Veritas AI'
export const APP_TAGLINE = "Don't consume information. Verify it."

/** YouTube walkthrough — replace with your final video URL when uploaded */
export const DEMO_VIDEO_URL =
  'https://www.youtube.com/watch?v=REPLACE_WITH_YOUR_VIDEO_ID'

export const ROUTES = {
  home: '/',
  dashboard: '/app',
  history: '/app/history',
  graph: '/app/graph',
  settings: '/app/settings',
  judge: '/judge',
  analysis: (id: string) => `/app/analysis/${id}`,
  share: (token: string) => `/share/${token}`,
  demo: DEMO_VIDEO_URL,
} as const

export const FOCUS_INTAKE_EVENT = 'veritas:focus-intake' as const

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export { MAX_CONTENT_LENGTH } from '@veritas/shared'
