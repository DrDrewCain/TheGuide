import { createClient, type RedisClientType } from 'redis'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'

let redisClient: RedisClientType

export async function connectRedis() {
  try {
    redisClient = createClient({
      url: config.REDIS_URL,
    })

    redisClient.on('error', err => {
      logger.error('Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      logger.info('Connected to Redis')
    })

    await redisClient.connect()
  } catch (error) {
    logger.error('Failed to connect to Redis:', error)
    throw error
  }
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.disconnect()
    logger.info('Disconnected from Redis')
  }
}

// Cache operations
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error(`Failed to get cache key ${key}:`, error)
      return null
    }
  },

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await redisClient.setEx(key, ttlSeconds, serialized)
      } else {
        await redisClient.set(key, serialized)
      }
    } catch (error) {
      logger.error(`Failed to set cache key ${key}:`, error)
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key)
    } catch (error) {
      logger.error(`Failed to delete cache key ${key}:`, error)
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      return (await redisClient.exists(key)) > 0
    } catch (error) {
      logger.error(`Failed to check existence of cache key ${key}:`, error)
      return false
    }
  },

  async clear(pattern: string = '*'): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        await redisClient.del(keys)
      }
    } catch (error) {
      logger.error(`Failed to clear cache with pattern ${pattern}:`, error)
    }
  },
}

export { redisClient }
