import { prisma } from '../../db/prisma.js'
import type { GoogleProfile } from './google.js'

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
  },

  async findById(id: string): Promise<UserRecord | null> {
    const row = await prisma.user.findUnique({ where: { id } })
    return row ? toUserRecord(row) : null
  },
}
