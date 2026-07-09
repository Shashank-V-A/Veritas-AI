import { OAuth2Client } from 'google-auth-library'
import { AppError } from '../../utils/errors.js'

export interface GoogleProfile {
  sub: string
  email: string
  name?: string
  picture?: string
}

function getRedirectUri(): string {
  const explicit = process.env.GOOGLE_CALLBACK_URL?.trim()
  if (explicit) return explicit

  const frontend = process.env.FRONTEND_URL?.trim() ?? 'http://localhost:5173'
  return `${frontend.replace(/\/$/, '')}/api/auth/google/callback`
}

function getClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  const redirectUri = getRedirectUri()

  if (!clientId || !clientSecret) {
    throw new AppError(
      'Google OAuth is not configured',
      'INTERNAL',
      503,
    )
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri)
}

export function getOAuthRedirectUri(): string {
  return getRedirectUri()
}

export function getGoogleAuthUrl(state: string): string {
  const client = getClient()
  return client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  })
}

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const client = getClient()
  const { tokens } = await client.getToken(code)

  if (!tokens.id_token) {
    throw new AppError('Google did not return an ID token', 'INTERNAL', 502)
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload?.sub || !payload.email) {
    throw new AppError('Invalid Google profile', 'INTERNAL', 502)
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  }
}
