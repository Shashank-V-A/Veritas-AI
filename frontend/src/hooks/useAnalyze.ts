import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { api } from '@/services/api'
import type { AnalyzeRequest } from '@/types'

export function useAnalyze() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AnalyzeRequest) => api.analyze(payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      navigate(ROUTES.analysis(data.id))
    },
  })
}
