import { prisma } from '../../db/prisma.js'
import type { GoogleProfile } from './google.js'
import type { SessionPayload } from './jwt.js'

export interface UserRecord {
  id: string
  email: string
  name?: string
  avatar?: string
}

function toUserRecord(row: {
  id: string
  email: string
  name: string | null
  avatar: string | null
}): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? undefined,
    avatar: row.avatar ?? undefined,
  }
}

export const userRepository = {
  async upsertFromGoogle(profile: GoogleProfile): Promise<UserRecord> {
    try {
      const row = await prisma.user.upsert({
        where: { googleId: profile.sub },
        create: {
          googleId: profile.sub,
          email: profile.email,
          name: profile.name,
          avatar: profile.picture,
        },
        update: {
          email: profile.email,
          name: profile.name,
          avatar: profile.picture,
        },
      })
      return toUserRecord(row)
    } catch {
      // Ephemeral Vercel DB may have a restored row with this email but a
      // placeholder googleId — reclaim it on real Google sign-in.
      const existing = await prisma.user.findUnique({
        where: { email: profile.email },
      })
      if (!existing) throw new Error('Failed to upsert Google user')

      const row = await prisma.user.update({
        where: { id: existing.id },
        data: {
          googleId: profile.sub,
          name: profile.name,
          avatar: profile.picture,
        },
      })
      return toUserRecord(row)
    }
  },

  /**
   * Rehydrate the User row after ephemeral SQLite (/tmp) cold starts wipe
   * the DB while the JWT session is still valid.
   */
  async ensureFromSession(session: SessionPayload): Promise<UserRecord> {
    const byId = await prisma.user.findUnique({ where: { id: session.sub } })
    if (byId) {
      return toUserRecord(byId)
    }

    const byEmail = await prisma.user.findUnique({
      where: { email: session.email },
    })
    if (byEmail) {
      return toUserRecord(byEmail)
    }

    const row = await prisma.user.create({
      data: {
        id: session.sub,
        googleId: `restored:${session.sub}`,
        email: session.email,
        name: session.name ?? null,
        avatar: session.picture ?? null,
      },
    })
    return toUserRecord(row)
  },

  async findById(id: string): Promise<UserRecord | null> {
    const row = await prisma.user.findUnique({ where: { id } })
    return row ? toUserRecord(row) : null
  },
}
