import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../data/database.js'
import { authenticate } from '../middleware/auth.middleware.js'

export const userRouter = Router()

// All user routes require authentication
userRouter.use(authenticate)

// Get user profile
userRouter.get('/profile', async (req, res, next) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.user?.userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
    })

    if (!profile) {
      // Create a default profile if none exists
      const newProfile = await prisma.userProfile.create({
        data: {
          userId: req.user?.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              emailVerified: true,
              createdAt: true,
            },
          },
        },
      })
      return res.json(newProfile)
    }

    res.json(profile)
  } catch (error) {
    next(error)
  }
})

// Update user profile
const updateProfileSchema = z.object({
  age: z.number().min(18).max(120).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  dependents: z.number().min(0).max(20).optional(),
  currentRole: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  yearsExperience: z.number().min(0).max(60).optional(),
  salary: z.number().min(0).max(10000000).optional(),
  financialData: z.object({}).optional(),
  preferences: z.object({}).optional(),
})

userRouter.put('/profile', async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body)

    const profile = await prisma.userProfile.upsert({
      where: { userId: req.user?.userId },
      update: data,
      create: {
        userId: req.user?.userId,
        ...data,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
    })

    res.json(profile)
  } catch (error) {
    next(error)
  }
})

// Delete user account
userRouter.delete('/account', async (req, res, next) => {
  try {
    // Delete user (cascade will delete profile, decisions, etc.)
    await prisma.user.delete({
      where: { id: req.user?.userId },
    })

    res.json({ message: 'Account deleted successfully' })
  } catch (error) {
    next(error)
  }
})
