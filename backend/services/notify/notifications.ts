import { prisma } from '../../db/prisma.js'

export type NotificationType = 'watch_web_hit' | 'watch_analysis_hit'

export async function createNotification(input: {
  userId: string
  type: NotificationType
  title: string
  body?: string
  href?: string
  meta?: Record<string, unknown>
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title.slice(0, 200),
      body: input.body?.slice(0, 1000) ?? null,
      href: input.href?.slice(0, 500) ?? null,
      meta: input.meta ? JSON.stringify(input.meta).slice(0, 2000) : null,
    },
  })
}

export async function listNotifications(userId: string, limit = 30) {
  const items = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  const unreadCount = await prisma.notification.count({
    where: { userId, readAt: null },
  })
  return { items, unreadCount }
}

export async function markNotificationRead(userId: string, id: string) {
  const existing = await prisma.notification.findFirst({
    where: { id, userId },
  })
  if (!existing) return null
  if (existing.readAt) return existing
  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  })
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}
