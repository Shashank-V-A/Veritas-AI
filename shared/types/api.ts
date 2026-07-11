import type { CredibilityReport, SourceType, Verdict, AnalysisCategory } from './analysis.js'

export interface AnalyzeRequest {
  content: string
  sourceType: SourceType
  title?: string
  category?: AnalysisCategory
}

export interface UrlAnalyzeRequest {
  url: string
  title?: string
  category?: AnalysisCategory
}

export interface AnalyzeMeta {
  meshModel?: string
  meshLatencyMs?: number
}

export interface AnalyzeResponse {
  id: string
  report: CredibilityReport
  createdAt: string
  shareToken?: string
  meta?: AnalyzeMeta
}

export interface HistoryResponse {
  items: Array<{
    id: string
    title?: string
    trustScore: number
    sourceType: SourceType
    createdAt: string
    preview: string
    verdict?: Verdict
    category?: AnalysisCategory
  }>
  total: number
  page: number
  limit: number
}

export interface ShareLinkResponse {
  shareToken: string
  shareUrl: string
}

export interface PublicReportResponse {
  id: string
  title?: string
  content?: string
  sourceType: SourceType
  trustScore: number
  verdict: Verdict
  category?: AnalysisCategory
  report: CredibilityReport
  createdAt: string
  meshModel?: string
  meshLatencyMs?: number
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
  | 'UNAUTHORIZED'
  | 'RATE_LIMIT'
  | 'MESH_TIMEOUT'
  | 'MESH_ERROR'
  | 'MESH_NOT_CONFIGURED'
  | 'INTERNAL'
