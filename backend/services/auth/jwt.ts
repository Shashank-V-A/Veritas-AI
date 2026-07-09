import jwt from 'jsonwebtoken'

export const SESSION_COOKIE = 'veritas_session'

export interface SessionPayload {
  sub: string
  email: string
  name?: string
  picture?: string
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production')
  }
  return secret ?? 'dev-jwt-secret-change-me'
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getSecret()) as SessionPayload
  } catch {
    return null
  }
}
