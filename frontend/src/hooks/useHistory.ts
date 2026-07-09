import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { api } from '@/services/api'

export function useHistory(params?: {
  page?: number
  limit?: number
  search?: string
}) {
  return useQuery({
    queryKey: queryKeys.history(params),
    queryFn: () => api.getHistory(params),
  })
}

export function useReport(id: string) {
  return useQuery({
    queryKey: queryKeys.report(id),
    queryFn: () => api.getReport(id),
    enabled: Boolean(id),
  })
}
