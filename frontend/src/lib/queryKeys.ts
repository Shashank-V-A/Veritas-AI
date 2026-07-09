export const queryKeys = {
  history: (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    verdict?: string
  }) => ['history', params] as const,
  report: (id: string) => ['report', id] as const,
  publicReport: (token: string) => ['publicReport', token] as const,
}
