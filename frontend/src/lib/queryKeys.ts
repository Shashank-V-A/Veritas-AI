export const queryKeys = {
  history: (params?: { page?: number; limit?: number; search?: string }) =>
    ['history', params] as const,
  report: (id: string) => ['report', id] as const,
}
