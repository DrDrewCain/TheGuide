import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../data/database.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { createError } from '../middleware/errorHandler.js'

export const decisionRouter = Router()

// All decision routes require authentication
decisionRouter.use(authenticate)

// Get all decisions for user
decisionRouter.get('/', async (req, res, next) => {
  try {
    const { status, type } = req.query

    const decisions = await prisma.decision.findMany({
      where: {
        userId: req.user?.userId,
        ...(status && { status: status as string }),
        ...(type && { type: type as string }),
      },
      include: {
        options: true,
        _count: {
          select: { simulations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(decisions)
  } catch (error) {
    next(error)
  }
})

// Create decision schema
const createDecisionSchema = z.object({
  type: z.enum([
    'career_change',
    'job_offer',
    'relocation',
    'education',
    'home_purchase',
    'investment',
    'family_planning',
    'retirement',
    'business_startup',
  ]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  decisionDeadline: z.string().datetime().optional(),
  parameters: z.object({}).optional(),
  constraints: z.array(z.object({})).optional(),
  options: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        parameters: z.object({}).optional(),
        pros: z.array(z.string()).optional(),
        cons: z.array(z.string()).optional(),
      })
    )
    .min(2),
})

// Create new decision
decisionRouter.post('/', async (req, res, next) => {
  try {
    const data = createDecisionSchema.parse(req.body)

    const decision = await prisma.decision.create({
      data: {
        userId: req.user?.userId,
        type: data.type,
        title: data.title,
        description: data.description,
        decisionDeadline: data.decisionDeadline ? new Date(data.decisionDeadline) : undefined,
        parameters: data.parameters || {},
        constraints: data.constraints || [],
        options: {
          create: data.options.map(option => ({
            title: option.title,
            description: option.description,
            parameters: option.parameters || {},
            pros: option.pros || [],
            cons: option.cons || [],
          })),
        },
      },
      include: {
        options: true,
      },
    })

    res.status(201).json(decision)
  } catch (error) {
    next(error)
  }
})

// Get single decision
decisionRouter.get('/:id', async (req, res, next) => {
  try {
    const decision = await prisma.decision.findFirst({
      where: {
        id: req.params.id,
        userId: req.user?.userId,
      },
      include: {
        options: {
          include: {
            _count: {
              select: { simulations: true },
            },
          },
        },
        simulations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            optionId: true,
            status: true,
            createdAt: true,
            completedAt: true,
            aggregateMetrics: true,
          },
        },
      },
    })

    if (!decision) {
      return next(createError('Decision not found', 404))
    }

    res.json(decision)
  } catch (error) {
    next(error)
  }
})

// Update decision
const updateDecisionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z
    .enum(['draft', 'analyzing', 'simulated', 'decided', 'implemented', 'archived'])
    .optional(),
  decisionDeadline: z.string().datetime().optional(),
  implementedAt: z.string().datetime().optional(),
})

decisionRouter.put('/:id', async (req, res, next) => {
  try {
    const data = updateDecisionSchema.parse(req.body)

    // Check ownership
    const existing = await prisma.decision.findFirst({
      where: {
        id: req.params.id,
        userId: req.user?.userId,
      },
    })

    if (!existing) {
      return next(createError('Decision not found', 404))
    }

    const decision = await prisma.decision.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.decisionDeadline && { decisionDeadline: new Date(data.decisionDeadline) }),
        ...(data.implementedAt && { implementedAt: new Date(data.implementedAt) }),
      },
      include: {
        options: true,
      },
    })

    res.json(decision)
  } catch (error) {
    next(error)
  }
})

// Delete decision
decisionRouter.delete('/:id', async (req, res, next) => {
  try {
    // Check ownership
    const existing = await prisma.decision.findFirst({
      where: {
        id: req.params.id,
        userId: req.user?.userId,
      },
    })

    if (!existing) {
      return next(createError('Decision not found', 404))
    }

    await prisma.decision.delete({
      where: { id: req.params.id },
    })

    res.json({ message: 'Decision deleted successfully' })
  } catch (error) {
    next(error)
  }
})
