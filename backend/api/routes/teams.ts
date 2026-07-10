import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { requireAuth } from '../middleware/auth.js'

export const teamsRouter = Router()

teamsRouter.use(requireAuth)

teamsRouter.post('/', async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 80) : 'Newsroom'
    const userId = req.user!.sub

    const team = await prisma.team.create({
      data: {
        name,
        members: { create: { userId, role: 'owner' } },
      },
      include: { members: true },
    })

    res.status(201).json(team)
  } catch (error) {
    next(error)
  }
})

teamsRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.sub
    const teams = await prisma.teamMember.findMany({
      where: { userId },
      include: { team: { include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } } },
    })
    res.json({ teams: teams.map((m) => m.team) })
  } catch (error) {
    next(error)
  }
})

teamsRouter.get('/:teamId/analyses', async (req, res, next) => {
  try {
    const userId = req.user!.sub
    const teamId = req.params.teamId

    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    })
    if (!membership) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Team not found' } })
      return
    }

    const analyses = await prisma.analysis.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        trustScore: true,
        verdict: true,
        sourceType: true,
        createdAt: true,
      },
    })

    res.json({ analyses })
  } catch (error) {
    next(error)
  }
})
