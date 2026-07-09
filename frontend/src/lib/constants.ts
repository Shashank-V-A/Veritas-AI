export const APP_NAME = 'Veritas AI'
export const APP_TAGLINE = "Don't consume information. Verify it."

export const ROUTES = {
  home: '/',
  dashboard: '/app',
  history: '/app/history',
  analysis: (id: string) => `/app/analysis/${id}`,
  share: (token: string) => `/share/${token}`,
  demo: '/#sample-dossier',
} as const

export const FOCUS_INTAKE_EVENT = 'veritas:focus-intake' as const

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export { MAX_CONTENT_LENGTH } from '@veritas/shared'
