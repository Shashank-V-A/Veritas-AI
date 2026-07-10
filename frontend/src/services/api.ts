import { API_BASE_URL } from '@/lib/constants'
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiErrorBody,
  AnalysisRecord,
  HistoryResponse,
  PublicReportResponse,
  ShareLinkResponse,
  UrlAnalyzeRequest,
} from '@veritas/shared'
import type {
  ClaimRelation,
  ClaimTimelineEvent,
  ConfidenceInterval,
  SourceLineageItem,
} from '@veritas/shared'

class ApiClientError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
  }
}

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

export interface ForwardCheckResponse {
  score: number
  signals: string[]
  suggestedSourceType?: 'forward'
}

export interface CaseAnnotation {
  id: string
  analysisId: string
  userId: string
  claimIndex?: number | null
  note: string
  createdAt: string
}

export interface AnnotationsResponse {
  annotations: CaseAnnotation[]
}

export interface ScheduleRecheckRequest {
  sourceUrl?: string
  analysisId?: string
  days?: number
}

export interface ScheduledRecheck {
  id: string
  userId: string
  sourceUrl?: string | null
  analysisId?: string | null
  runAt: string
  createdAt: string
}

export interface Team {
  id: string
  name: string
  createdAt: string
  members?: Array<{
    id: string
    userId: string
    role: string
    user?: { id: string; name?: string; email: string }
  }>
}

export interface TeamsResponse {
  teams: Team[]
}

export interface CreateApiKeyResponse {
  key: string
  name: string
  message: string
}

export interface DomainReputation {
  domain: string
  caseCount: number
  lowTrustCount: number
  avgTrustScore: number
  updatedAt?: string
}

export type {
  ClaimRelation,
  ClaimTimelineEvent,
  ConfidenceInterval,
  SourceLineageItem,
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorBody: ApiErrorBody | null = null
    try {
      errorBody = (await response.json()) as ApiErrorBody
    } catch {
      // response body is not JSON
    }

    if (response.status === 401) {
      unauthorizedHandler?.()
    }

    throw new ApiClientError(
      errorBody?.error?.message ?? `Request failed with status ${response.status}`,
      errorBody?.error?.code ?? 'UNKNOWN_ERROR',
      response.status,
    )
  }

  return response.json() as Promise<T>
}

export function getOgImageUrl(token: string): string {
  const path = `${API_BASE_URL}/og/share/${encodeURIComponent(token)}`
  if (path.startsWith('http')) return path
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

export const api = {
  async analyze(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    return handleResponse<AnalyzeResponse>(response)
  },

  async analyzeGuest(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/analyze/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return handleResponse<AnalyzeResponse>(response)
  },

  async analyzeUrl(payload: UrlAnalyzeRequest): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/analyze/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    return handleResponse<AnalyzeResponse>(response)
  },

  async analyzeYoutube(
    url: string,
    options?: { title?: string; category?: string },
  ): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/analyze/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url, ...options }),
    })
    return handleResponse<AnalyzeResponse>(response)
  },

  async analyzeImage(file: File, title?: string): Promise<AnalyzeResponse> {
    const formData = new FormData()
    formData.append('image', file)
    if (title?.trim()) formData.append('title', title.trim())

    const response = await fetch(`${API_BASE_URL}/analyze/image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    return handleResponse<AnalyzeResponse>(response)
  },

  async forwardCheck(content: string): Promise<ForwardCheckResponse> {
    const response = await fetch(`${API_BASE_URL}/analyze/forward-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content }),
    })
    return handleResponse<ForwardCheckResponse>(response)
  },

  async analyzePdf(file: File, title?: string): Promise<AnalyzeResponse> {
    const formData = new FormData()
    formData.append('pdf', file)
    if (title?.trim()) formData.append('title', title.trim())

    const response = await fetch(`${API_BASE_URL}/analyze/pdf`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    return handleResponse<AnalyzeResponse>(response)
  },

  async scheduleRecheck(payload: ScheduleRecheckRequest): Promise<ScheduledRecheck> {
    const response = await fetch(`${API_BASE_URL}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    return handleResponse<ScheduledRecheck>(response)
  },

  async getAnnotations(analysisId: string): Promise<AnnotationsResponse> {
    const response = await fetch(`${API_BASE_URL}/annotations/${analysisId}`, {
      credentials: 'include',
    })
    return handleResponse<AnnotationsResponse>(response)
  },

  async addAnnotation(
    analysisId: string,
    note: string,
    claimIndex?: number,
  ): Promise<CaseAnnotation> {
    const response = await fetch(`${API_BASE_URL}/annotations/${analysisId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ note, claimIndex }),
    })
    return handleResponse<CaseAnnotation>(response)
  },

  async appealClaim(
    analysisId: string,
    claimIndex: number,
    reason?: string,
  ): Promise<{ ok: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/annotations/${analysisId}/appeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ claimIndex, reason }),
    })
    return handleResponse<{ ok: boolean; message: string }>(response)
  },

  async createTeam(name: string): Promise<Team> {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name }),
    })
    return handleResponse<Team>(response)
  },

  async getTeams(): Promise<TeamsResponse> {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      credentials: 'include',
    })
    return handleResponse<TeamsResponse>(response)
  },

  async createApiKey(name?: string): Promise<CreateApiKeyResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name }),
    })
    return handleResponse<CreateApiKeyResponse>(response)
  },

  async getDomainReputation(domain: string): Promise<DomainReputation | null> {
    const response = await fetch(
      `${API_BASE_URL}/domain/${encodeURIComponent(domain)}`,
      { credentials: 'include' },
    )
    if (response.status === 404) return null
    return handleResponse<DomainReputation>(response)
  },

  async getHistory(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    verdict?: string
  }): Promise<HistoryResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.search) searchParams.set('search', params.search)
    if (params?.category) searchParams.set('category', params.category)
    if (params?.verdict) searchParams.set('verdict', params.verdict)

    const query = searchParams.toString()
    const response = await fetch(
      `${API_BASE_URL}/history${query ? `?${query}` : ''}`,
      { credentials: 'include' },
    )
    return handleResponse<HistoryResponse>(response)
  },

  async getReport(id: string): Promise<AnalysisRecord> {
    const response = await fetch(`${API_BASE_URL}/report/${id}`, {
      credentials: 'include',
    })
    return handleResponse<AnalysisRecord>(response)
  },

  async getPublicReport(token: string): Promise<PublicReportResponse> {
    const response = await fetch(`${API_BASE_URL}/public/report/${token}`)
    return handleResponse<PublicReportResponse>(response)
  },

  async shareReport(id: string): Promise<ShareLinkResponse> {
    const response = await fetch(`${API_BASE_URL}/report/${id}/share`, {
      method: 'POST',
      credentials: 'include',
    })
    return handleResponse<ShareLinkResponse>(response)
  },

  async reanalyzeReport(id: string): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/report/${id}/reanalyze`, {
      method: 'POST',
      credentials: 'include',
    })
    return handleResponse<AnalyzeResponse>(response)
  },

  async exportReportPdf(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/report/${id}/export`, {
      credentials: 'include',
    })

    if (!response.ok) {
      let errorBody: ApiErrorBody | null = null
      try {
        errorBody = (await response.json()) as ApiErrorBody
      } catch {
        // not JSON
      }

      if (response.status === 401) unauthorizedHandler?.()

      throw new ApiClientError(
        errorBody?.error?.message ?? 'PDF export failed',
        errorBody?.error?.code ?? 'UNKNOWN_ERROR',
        response.status,
      )
    }

    return response.blob()
  },

  async exportReportMarkdown(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/report/${id}/export/markdown`, {
      credentials: 'include',
    })

    if (!response.ok) {
      let errorBody: ApiErrorBody | null = null
      try {
        errorBody = (await response.json()) as ApiErrorBody
      } catch {
        // not JSON
      }

      if (response.status === 401) unauthorizedHandler?.()

      throw new ApiClientError(
        errorBody?.error?.message ?? 'Markdown export failed',
        errorBody?.error?.code ?? 'UNKNOWN_ERROR',
        response.status,
      )
    }

    return response.blob()
  },

  async deleteReport(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/report/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    await handleResponse<{ ok: boolean }>(response)
  },
}

export { ApiClientError }
