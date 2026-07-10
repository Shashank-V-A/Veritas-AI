import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { api } from '@/services/api'
import type { AnalyzeRequest, UrlAnalyzeRequest } from '@veritas/shared'

export function useAnalyze(options?: { onSuccess?: (id: string) => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  function handleSuccess(data: { id: string }) {
    void queryClient.invalidateQueries({ queryKey: ['history'] })
    if (options?.onSuccess) {
      options.onSuccess(data.id)
    } else {
      navigate(ROUTES.analysis(data.id))
    }
  }

  const textMutation = useMutation({
    mutationFn: (payload: AnalyzeRequest) => api.analyze(payload),
    onSuccess: handleSuccess,
  })

  const urlMutation = useMutation({
    mutationFn: (payload: UrlAnalyzeRequest) => api.analyzeUrl(payload),
    onSuccess: handleSuccess,
  })

  const pdfMutation = useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      api.analyzePdf(file, title),
    onSuccess: handleSuccess,
  })

  const youtubeMutation = useMutation({
    mutationFn: ({
      url,
      title,
      category,
    }: {
      url: string
      title?: string
      category?: AnalyzeRequest['category']
    }) => api.analyzeYoutube(url, { title, category }),
    onSuccess: handleSuccess,
  })

  const imageMutation = useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      api.analyzeImage(file, title),
    onSuccess: handleSuccess,
  })

  const reanalyzeMutation = useMutation({
    mutationFn: (id: string) => api.reanalyzeReport(id),
    onSuccess: handleSuccess,
  })

  const isPending =
    textMutation.isPending ||
    urlMutation.isPending ||
    pdfMutation.isPending ||
    youtubeMutation.isPending ||
    imageMutation.isPending ||
    reanalyzeMutation.isPending

  const isError =
    textMutation.isError ||
    urlMutation.isError ||
    pdfMutation.isError ||
    youtubeMutation.isError ||
    imageMutation.isError ||
    reanalyzeMutation.isError

  const error =
    textMutation.error ??
    urlMutation.error ??
    pdfMutation.error ??
    youtubeMutation.error ??
    imageMutation.error ??
    reanalyzeMutation.error

  return {
    mutate: textMutation.mutate,
    mutateUrl: urlMutation.mutate,
    mutatePdf: pdfMutation.mutate,
    mutateYoutube: youtubeMutation.mutate,
    mutateImage: imageMutation.mutate,
    reanalyze: reanalyzeMutation.mutate,
    isPending,
    isError,
    error,
    isReanalyzing: reanalyzeMutation.isPending,
  }
}

export function useGuestAnalyze(options?: {
  onSuccess?: (data: { id: string; shareToken?: string }) => void
}) {
  const mutation = useMutation({
    mutationFn: (payload: AnalyzeRequest) => api.analyzeGuest(payload),
    onSuccess: (data) => {
      options?.onSuccess?.({ id: data.id, shareToken: data.shareToken })
    },
  })

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  }
}
