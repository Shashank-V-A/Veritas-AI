import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { api } from '@/services/api'
import type { AnalyzeRequest } from '@veritas/shared'

export function useAnalyze() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const textMutation = useMutation({
    mutationFn: (payload: AnalyzeRequest) => api.analyze(payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      navigate(ROUTES.analysis(data.id))
    },
  })

  const pdfMutation = useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      api.analyzePdf(file, title),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      navigate(ROUTES.analysis(data.id))
    },
  })

  const isPending = textMutation.isPending || pdfMutation.isPending
  const isError = textMutation.isError || pdfMutation.isError
  const error = textMutation.error ?? pdfMutation.error

  return {
    mutate: textMutation.mutate,
    mutatePdf: pdfMutation.mutate,
    isPending,
    isError,
    error,
  }
}
