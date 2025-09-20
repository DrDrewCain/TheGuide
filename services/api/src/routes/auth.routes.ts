import { Router } from 'express'
import { AuthService, loginSchema, registerSchema } from '../domain/auth/auth.service.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { createError } from '../middleware/errorHandler.js'

export const authRouter = Router()

// Register
authRouter.post('/register', async (req, res, next) => {
  try {
    // Validate request body
    const { email, password } = registerSchema.parse(req.body)

    // Register user
    const result = await AuthService.register(email, password)

    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (error: any) {
    if (error.message === 'User already exists') {
      return next(createError('Email already registered', 409))
    }
    next(error)
  }
})

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body)

    // Login user
    const result = await AuthService.login(email, password)

    res.json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return next(createError('Invalid email or password', 401))
    }
    next(error)
  }
})

// Refresh tokens
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return next(createError('Refresh token required', 400))
    }

    const result = await AuthService.refreshTokens(refreshToken)

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (error: any) {
    if (error.message.includes('Invalid refresh token') || error.message.includes('expired')) {
      return next(createError('Invalid or expired refresh token', 401))
    }
    next(error)
  }
})

// Logout
authRouter.post('/logout', authenticate, async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' })
    }
    await AuthService.logout(req.user.userId)
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    next(error)
  }
})
