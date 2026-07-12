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

export interface DomainReputation {
  domain: string
  caseCount: number
  lowTrustCount: number
  avgTrustScore: number
  updatedAt?: string
}

export interface GraphNode {
  id: string
  label: string
  type: 'Analysis' | 'Claim' | 'Source' | 'Domain'
  meta?: Record<string, string | number | null>
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  type: string
}

export interface GraphSnapshot {
  configured: boolean
  connected: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
  error?: string
}

export interface ClaimWatchItem {
  id: string
  claimText: string
  claimNorm: string
  sourceAnalysisId?: string | null
  createdAt: string
  lastSeenAt?: string | null
  hitCount: number
  lastHitAnalysisId?: string | null
  emailAlerts?: boolean
  browserAlerts?: boolean
  lastWebScanAt?: string | null
  webHitCount?: number
}

export interface ClaimWatchHit {
  id: string
  watchId: string
  source: 'web' | 'analysis' | string
  title?: string | null
  url?: string | null
  snippet?: string | null
  analysisId?: string | null
  discoveredAt: string
}

export interface AppNotification {
  id: string
  type: string
  title: string
  body?: string | null
  href?: string | null
  readAt?: string | null
  createdAt: string
}

export interface CaseExhibit {
  id: string
  analysisId: string
  userId: string
  type: 'url' | 'note' | 'screenshot' | string
  title?: string | null
  url?: string | null
  note?: string | null
  createdAt: string
}

export interface DomainDossier {
  domain: string
  reputation: DomainReputation | null
  cases: Array<{
    id: string
    title?: string | null
    trustScore: number
    verdict?: string | null
    sourceUrl?: string | null
    createdAt: string
  }>
  trend: Array<{ date: string; avgTrustScore: number; caseCount: number }>
  commonClaims: Array<{ text: string; count: number }>
}

export interface NarrativeCluster {
  id: string
  title: string
  theme: string
  caseIds: string[]
  cases: Array<{
    id: string
    title: string | null
    trustScore: number
    verdict: string | null
    createdAt: string
  }>
  sharedClaims: string[]
  avgTrustScore: number
}

export interface VerdictFeedback {
  id: string
  analysisId: string
  originalVerdict: string
  suggestedVerdict?: string | null
  reason?: string | null
  createdAt: string
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
    // Two-step so Gemini transcript + Mesh analysis each stay under Vercel's 60s limit.
    const transcriptRes = await fetch(`${API_BASE_URL}/analyze/youtube/transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url }),
    })
    const transcript = await handleResponse<{
      content: string
      title: string
      videoId: string
      sourceUrl: string
    }>(transcriptRes)

    const response = await fetch(`${API_BASE_URL}/analyze/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        url,
        content: transcript.content,
        title: options?.title ?? transcript.title,
        category: options?.category,
      }),
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

  async getDomainReputation(domain: string): Promise<DomainReputation | null> {
    const response = await fetch(
      `${API_BASE_URL}/domain/${encodeURIComponent(domain)}`,
      { credentials: 'include' },
    )
    if (response.status === 404) return null
    return handleResponse<DomainReputation>(response)
  },

  async getGraph(limit = 40): Promise<GraphSnapshot> {
    const response = await fetch(`${API_BASE_URL}/graph?limit=${limit}`, {
      credentials: 'include',
    })
    return handleResponse<GraphSnapshot>(response)
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
      { credentials: 'include', cache: 'no-store' },
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
      cache: 'no-store',
    })
    await handleResponse<{ ok: boolean }>(response)
  },

  async getDomainDossier(domain: string): Promise<DomainDossier> {
    const response = await fetch(
      `${API_BASE_URL}/domain/${encodeURIComponent(domain)}/dossier`,
      { credentials: 'include' },
    )
    return handleResponse<DomainDossier>(response)
  },

  async getWatchlist(): Promise<{ items: ClaimWatchItem[]; emailConfigured: boolean }> {
    const response = await fetch(`${API_BASE_URL}/watchlist`, {
      credentials: 'include',
    })
    return handleResponse<{ items: ClaimWatchItem[]; emailConfigured: boolean }>(response)
  },

  async addWatch(claimText: string, sourceAnalysisId?: string): Promise<ClaimWatchItem> {
    const response = await fetch(`${API_BASE_URL}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ claimText, sourceAnalysisId }),
    })
    return handleResponse<ClaimWatchItem>(response)
  },

  async removeWatch(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/watchlist/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok && response.status !== 204) {
      await handleResponse(response)
    }
  },

  async scanWatchlist(): Promise<{ scanned: number; newHits: number }> {
    const response = await fetch(`${API_BASE_URL}/watchlist/scan`, {
      method: 'POST',
      credentials: 'include',
    })
    return handleResponse<{ scanned: number; newHits: number }>(response)
  },

  async scanWatch(id: string): Promise<{ newHits: number; scanned: boolean }> {
    const response = await fetch(`${API_BASE_URL}/watchlist/${id}/scan`, {
      method: 'POST',
      credentials: 'include',
    })
    return handleResponse<{ newHits: number; scanned: boolean }>(response)
  },

  async getWatchHits(id: string): Promise<{ hits: ClaimWatchHit[]; watch: ClaimWatchItem }> {
    const response = await fetch(`${API_BASE_URL}/watchlist/${id}/hits`, {
      credentials: 'include',
    })
    return handleResponse<{ hits: ClaimWatchHit[]; watch: ClaimWatchItem }>(response)
  },

  async updateWatch(
    id: string,
    patch: { emailAlerts?: boolean; browserAlerts?: boolean },
  ): Promise<ClaimWatchItem> {
    const response = await fetch(`${API_BASE_URL}/watchlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    })
    return handleResponse<ClaimWatchItem>(response)
  },

  async getNotifications(limit = 30): Promise<{
    items: AppNotification[]
    unreadCount: number
  }> {
    const response = await fetch(`${API_BASE_URL}/notifications?limit=${limit}`, {
      credentials: 'include',
    })
    return handleResponse<{ items: AppNotification[]; unreadCount: number }>(response)
  },

  async markNotificationRead(id: string): Promise<AppNotification> {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'POST',
      credentials: 'include',
    })
    return handleResponse<AppNotification>(response)
  },

  async markAllNotificationsRead(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      credentials: 'include',
    })
    await handleResponse<{ ok: boolean }>(response)
  },

  async getExhibits(analysisId: string): Promise<{ exhibits: CaseExhibit[] }> {
    const response = await fetch(`${API_BASE_URL}/exhibits/${analysisId}`, {
      credentials: 'include',
    })
    return handleResponse<{ exhibits: CaseExhibit[] }>(response)
  },

  async addExhibit(
    analysisId: string,
    payload: { type: string; title?: string; url?: string; note?: string },
  ): Promise<CaseExhibit> {
    const response = await fetch(`${API_BASE_URL}/exhibits/${analysisId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    return handleResponse<CaseExhibit>(response)
  },

  async deleteExhibit(analysisId: string, exhibitId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/exhibits/${analysisId}/${exhibitId}`,
      { method: 'DELETE', credentials: 'include' },
    )
    if (!response.ok && response.status !== 204) {
      await handleResponse(response)
    }
  },

  async getNarratives(limit = 8): Promise<{ clusters: NarrativeCluster[] }> {
    const response = await fetch(`${API_BASE_URL}/graph/narratives?limit=${limit}`, {
      credentials: 'include',
    })
    return handleResponse<{ clusters: NarrativeCluster[] }>(response)
  },

  async submitVerdictFeedback(
    id: string,
    payload: { reason?: string; suggestedVerdict?: string },
  ): Promise<VerdictFeedback> {
    const response = await fetch(`${API_BASE_URL}/report/${id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    return handleResponse<VerdictFeedback>(response)
  },

  async getVerdictFeedback(id: string): Promise<{ feedback: VerdictFeedback | null }> {
    const response = await fetch(`${API_BASE_URL}/report/${id}/feedback`, {
      credentials: 'include',
    })
    return handleResponse<{ feedback: VerdictFeedback | null }>(response)
  },
}

export { ApiClientError }
