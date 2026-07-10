import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { queryKeys } from '@/lib/queryKeys'
import { api } from '@/services/api'
import type { HistoryResponse } from '@veritas/shared'

interface UseDeleteReportOptions {
  /** When true (default), navigate to case files after delete. Set false for list cards. */
  redirect?: boolean
}

export function useDeleteReport(options: UseDeleteReportOptions = {}) {
  const { redirect = true } = options
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteReport(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['history'] })

      const previous = queryClient.getQueriesData<HistoryResponse>({
        queryKey: ['history'],
      })

      // Optimistically remove from every history list (workspace + archive)
      queryClient.setQueriesData<HistoryResponse>({ queryKey: ['history'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.filter((item) => item.id !== id),
          total: Math.max(0, old.total - 1),
        }
      })

      queryClient.removeQueries({ queryKey: queryKeys.report(id) })

      return { previous }
    },
    onError: (_error, _id, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['history'] })
    },
    onSuccess: () => {
      if (redirect) {
        navigate(ROUTES.history, { replace: true })
      }
    },
  })
}
