import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { config } from '../../config/env.js'
import { prisma } from '../../data/database.js'

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// JWT payload type
interface JwtPayload {
  userId: string
  email: string
}

export class AuthService {
  private static readonly SALT_ROUNDS = 10
  private static readonly REFRESH_TOKEN_LENGTH = 64

  static async register(email: string, password: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, AuthService.SALT_ROUNDS)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    })

    // Generate tokens
    const { accessToken, refreshToken } = await AuthService.generateTokens(user.id, user.email)

    return {
      user,
      accessToken,
      refreshToken,
    }
  }

  static async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // Generate tokens
    const { accessToken, refreshToken } = await AuthService.generateTokens(user.id, user.email)

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    }
  }

  static async refreshTokens(refreshToken: string) {
    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!storedToken) {
      throw new Error('Invalid refresh token')
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      })
      throw new Error('Refresh token expired')
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    })

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await AuthService.generateTokens(
      storedToken.user.id,
      storedToken.user.email
    )

    return {
      accessToken,
      refreshToken: newRefreshToken,
    }
  }

  static async logout(userId: string) {
    // Delete all refresh tokens for the user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    })
  }

  static async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload
      return payload
    } catch (_error) {
      throw new Error('Invalid access token')
    }
  }

  private static async generateTokens(userId: string, email: string) {
    // Generate access token
    const accessToken = jwt.sign({ userId, email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    } as jwt.SignOptions)

    // Generate refresh token
    const refreshToken = AuthService.generateRandomToken()

    // Calculate expiry date (30 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    })

    return { accessToken, refreshToken }
  }

  private static generateRandomToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < AuthService.REFRESH_TOKEN_LENGTH; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }
}
