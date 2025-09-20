import type { NextFunction, Request, Response } from 'express'
import { AuthService } from '../domain/auth/auth.service.js'
import { logger } from '../utils/logger.js'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
      }
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Verify token
    const payload = await AuthService.verifyAccessToken(token)

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    }

    next()
  } catch (error) {
    logger.error('Authentication error:', error)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const payload = await AuthService.verifyAccessToken(token)
      req.user = {
        userId: payload.userId,
        email: payload.email,
      }
    }

    next()
  } catch (_error) {
    // Just continue without user
    next()
  }
}
