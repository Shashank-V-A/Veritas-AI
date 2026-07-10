import { createHash } from 'node:crypto'
import type { RequestHandler } from 'express'
import { prisma } from '../../db/prisma.js'

declare module 'express-serve-static-core' {
  interface Request {
    apiUserId?: string
  }
}

export const requireApiKey: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization
  const rawKey = header?.startsWith('Bearer ') ? header.slice(7) : req.headers['x-api-key']

  if (typeof rawKey !== 'string' || !rawKey.startsWith('vta_')) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Valid API key required (Bearer vta_...)' },
    })
    return
  }

  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } })

  if (!apiKey) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } })
    return
  }

  req.apiUserId = apiKey.userId
  void prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  })

  next()
}
