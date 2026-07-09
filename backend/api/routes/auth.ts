import { randomBytes } from 'node:crypto'
import { Router } from 'express'
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

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  }
}

export const authRouter = Router()

authRouter.get('/google', (_req, res, next) => {
  try {
    const state = randomBytes(24).toString('hex')
    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/',
    })
    res.redirect(getGoogleAuthUrl(state))
  } catch (error) {
    next(error)
  }
})

authRouter.get('/google/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query

    if (error) {
      throw new AppError(
        typeof error === 'string' ? error : 'Google sign-in was cancelled',
        'INTERNAL',
        400,
      )
    }

    if (typeof code !== 'string' || typeof state !== 'string') {
      throw new AppError('Invalid OAuth callback', 'VALIDATION_ERROR', 400)
    }

    const savedState = req.cookies?.[OAUTH_STATE_COOKIE]
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' })

    if (!savedState || savedState !== state) {
      throw new AppError('Invalid OAuth state', 'VALIDATION_ERROR', 400)
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
    res.clearCookie(SESSION_COOKIE, { path: '/' })
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
  res.clearCookie(SESSION_COOKIE, { path: '/' })
  res.json({ ok: true })
})
