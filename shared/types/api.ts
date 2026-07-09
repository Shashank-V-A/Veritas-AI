import type { CredibilityReport, SourceType } from './analysis.js'

export interface AnalyzeRequest {
  content: string
  sourceType: SourceType
  title?: string
}

export interface AnalyzeResponse {
  id: string
  report: CredibilityReport
  createdAt: string
}

export interface HistoryResponse {
  items: Array<{
    id: string
    title?: string
    trustScore: number
    sourceType: SourceType
    createdAt: string
    preview: string
  }>
  total: number
  page: number
  limit: number
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}

export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar?: string
}

export interface AuthMeResponse {
  user: AuthUser | null
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'MESH_TIMEOUT'
  | 'MESH_ERROR'
  | 'MESH_NOT_CONFIGURED'
  | 'INTERNAL'
