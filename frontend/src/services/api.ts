import { API_BASE_URL } from '@/lib/constants'
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiErrorBody,
  AnalysisRecord,
  HistoryResponse,
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

  async getHistory(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<HistoryResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.search) searchParams.set('search', params.search)

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

  async deleteReport(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/report/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    await handleResponse<{ ok: boolean }>(response)
  },
}

export { ApiClientError }
