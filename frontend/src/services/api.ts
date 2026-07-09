import { API_BASE_URL } from '@/lib/constants'
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiError,
  AnalysisRecord,
  HistoryResponse,
} from '@/types'

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorBody: ApiError | null = null
    try {
      errorBody = (await response.json()) as ApiError
    } catch {
      // response body is not JSON
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
      body: JSON.stringify(payload),
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
    )
    return handleResponse<HistoryResponse>(response)
  },

  async getReport(id: string): Promise<AnalysisRecord> {
    const response = await fetch(`${API_BASE_URL}/report/${id}`)
    return handleResponse<AnalysisRecord>(response)
  },
}

export { ApiClientError }
