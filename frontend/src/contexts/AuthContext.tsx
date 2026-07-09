import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { authApi, type AuthUser } from '@/services/auth'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], { user: null })
      queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })

  const login = useCallback(() => {
    authApi.login()
  }, [])

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
    navigate(ROUTES.home, { replace: true })
  }, [logoutMutation, navigate])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data?.user ?? null,
      isLoading,
      isAuthenticated: Boolean(data?.user),
      login,
      logout,
    }),
    [data?.user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
