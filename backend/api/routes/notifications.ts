import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notify/notifications.js'

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth)

notificationsRouter.get('/', async (req, res, next) => {
  try {
    const parsed = Number.parseInt(String(req.query.limit ?? '30'), 10)
    const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 30
    const result = await listNotifications(req.user!.sub, limit)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

notificationsRouter.post('/read-all', async (req, res, next) => {
  try {
    await markAllNotificationsRead(req.user!.sub)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

notificationsRouter.post('/:id/read', async (req, res, next) => {
  try {
    const item = await markNotificationRead(req.user!.sub, req.params.id)
    if (!item) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } })
      return
    }
    res.json(item)
  } catch (error) {
    next(error)
  }
})
