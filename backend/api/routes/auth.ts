import { randomBytes } from 'node:crypto'
import { Router, type Response } from 'express'
import {
  exchangeGoogleCode,
  getGoogleAuthUrl,
} from '../../services/auth/google.js'
import {
  SESSION_COOKIE,
  signSession,
  verifySession,
} from '../../services/auth/jwt.js'
import { userRepository } from '../../services/auth/userRepository.js'
import { AppError } from '../../utils/errors.js'

const OAUTH_STATE_COOKIE = 'veritas_oauth_state'

function getFrontendUrl(): string {
  return process.env.FRONTEND_URL ?? 'http://localhost:5173'
}

function cookieBaseOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    // Share session cookies across localhost ports in local dev.
    ...(isProduction ? {} : { domain: 'localhost' }),
  }
}

function sessionCookieOptions() {
  return {
    ...cookieBaseOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }
}

function clearAuthCookie(res: Response, name: string) {
  res.clearCookie(name, cookieBaseOptions())
}

export const authRouter = Router()

authRouter.get('/google', (_req, res, next) => {
  try {
    const state = randomBytes(24).toString('hex')
    res.cookie(OAUTH_STATE_COOKIE, state, {
      ...cookieBaseOptions(),
      maxAge: 10 * 60 * 1000,
    })
    res.redirect(getGoogleAuthUrl(state))
  } catch (error) {
    next(error)
  }
})

function authErrorRedirect(res: Response, message: string) {
  const url = new URL(getFrontendUrl())
  url.searchParams.set('auth_error', message)
  res.redirect(url.toString())
}

authRouter.get('/google/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query

    if (error) {
      const message =
        typeof error === 'string' ? error : 'Google sign-in was cancelled'
      authErrorRedirect(res, message)
      return
    }

    if (typeof code !== 'string' || typeof state !== 'string') {
      authErrorRedirect(res, 'Invalid OAuth callback')
      return
    }

    const savedState = req.cookies?.[OAUTH_STATE_COOKIE]
    clearAuthCookie(res, OAUTH_STATE_COOKIE)

    if (!savedState || savedState !== state) {
      authErrorRedirect(res, 'Invalid OAuth state — try signing in again')
      return
    }

    const profile = await exchangeGoogleCode(code)
    const user = await userRepository.upsertFromGoogle(profile)

    const token = signSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.avatar,
    })

    res.cookie(SESSION_COOKIE, token, sessionCookieOptions())
    res.redirect(`${getFrontendUrl()}/app`)
  } catch (error) {
    if (error instanceof AppError) {
      authErrorRedirect(res, error.message)
      return
    }
    next(error)
  }
})

authRouter.get('/me', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE]
  if (!token) {
    res.json({ user: null })
    return
  }

  const session = verifySession(token)
  if (!session) {
    clearAuthCookie(res, SESSION_COOKIE)
    res.json({ user: null })
    return
  }

  res.json({
    user: {
      id: session.sub,
      email: session.email,
      name: session.name,
      avatar: session.picture,
    },
  })
})

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res, SESSION_COOKIE)
  res.json({ ok: true })
})
