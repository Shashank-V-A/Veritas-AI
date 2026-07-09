import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { api } from '@/services/api'

export function useDeleteReport() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteReport(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      navigate(ROUTES.history, { replace: true })
    },
  })
}
