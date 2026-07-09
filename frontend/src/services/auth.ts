import { API_BASE_URL } from '@/lib/constants'

export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar?: string
}

export interface AuthMeResponse {
  user: AuthUser | null
}

const defaultFetchOptions: RequestInit = {
  credentials: 'include',
}

export const authApi = {
  getMe(): Promise<AuthMeResponse> {
    return fetch(`${API_BASE_URL}/auth/me`, defaultFetchOptions).then(
      (response) => response.json() as Promise<AuthMeResponse>,
    )
  },

  login(): void {
    window.location.href = `${API_BASE_URL}/auth/google`
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      ...defaultFetchOptions,
      method: 'POST',
    })
  },
}
