import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../data/database.js'
import { addSimulationJob } from '../jobs/queue.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { createError } from '../middleware/errorHandler.js'

export const simulationRouter = Router()

// All simulation routes require authentication
simulationRouter.use(authenticate)

// Run simulation
const runSimulationSchema = z.object({
  decisionId: z.string().cuid(),
  optionId: z.string().cuid(),
})

simulationRouter.post('/run', async (req, res, next) => {
  try {
    const { decisionId, optionId } = runSimulationSchema.parse(req.body)

    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    // Verify decision and option exist and belong to user
    const decision = await prisma.decision.findFirst({
      where: {
        id: decisionId,
        userId: req.user.userId,
        options: {
          some: { id: optionId },
        },
      },
    })

    if (!decision) {
      return next(createError('Decision or option not found', 404))
    }

    // Create simulation record
    const simulation = await prisma.simulation.create({
      data: {
        decisionId,
        optionId,
        status: 'pending',
      },
    })

    // Queue simulation job
    const job = await addSimulationJob({
      simulationId: simulation.id,
      decisionId,
      optionId,
      userId: req.user.userId,
    })

    res.status(202).json({
      id: simulation.id,
      jobId: job.id,
      status: 'pending',
      message: 'Simulation queued for processing',
    })
  } catch (error) {
    next(error)
  }
})

// Get simulation by ID
simulationRouter.get('/:id', async (req, res, next) => {
  try {
    const simulation = await prisma.simulation.findFirst({
      where: {
        id: req.params.id,
        decision: {
          userId: req.user?.userId,
        },
      },
      include: {
        decision: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        option: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!simulation) {
      return next(createError('Simulation not found', 404))
    }

    res.json(simulation)
  } catch (error) {
    next(error)
  }
})

// Get simulation history
simulationRouter.get('/', async (req, res, next) => {
  try {
    const { decisionId, status, limit = '10', offset = '0' } = req.query

    const where = {
      decision: {
        userId: req.user?.userId,
      },
      ...(decisionId && { decisionId: decisionId as string }),
      ...(status && { status: status as string }),
    }

    const [simulations, total] = await Promise.all([
      prisma.simulation.findMany({
        where,
        include: {
          decision: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
          option: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
      prisma.simulation.count({ where }),
    ])

    res.json({
      simulations,
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    })
  } catch (error) {
    next(error)
  }
})

// Export simulation results
simulationRouter.post('/:id/export', async (req, res, next) => {
  try {
    const simulation = await prisma.simulation.findFirst({
      where: {
        id: req.params.id,
        status: 'completed',
        decision: {
          userId: req.user?.userId,
        },
      },
      include: {
        decision: true,
        option: true,
      },
    })

    if (!simulation) {
      return next(createError('Simulation not found or not completed', 404))
    }

    // TODO: Implement actual export logic (PDF, CSV, etc.)
    res.json({
      message: 'Export functionality coming soon',
      simulation: {
        id: simulation.id,
        decisionTitle: simulation.decision.title,
        optionTitle: simulation.option.title,
        results: simulation.results,
      },
    })
  } catch (error) {
    next(error)
  }
})
