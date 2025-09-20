import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { redisClient } from '../data/redis.js'

export const healthRouter = Router()

healthRouter.get('/', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'api',
    version: '1.0.0',
  }

  res.json(health)
})

healthRouter.get('/detailed', async (_req, res) => {
  const checks = {
    api: 'ok',
    supabase: 'checking',
    redis: 'checking',
  }

  // Check Supabase connection
  try {
    const { error } = await supabase.from('user_profiles').select('id').limit(1)
    checks.supabase = error ? 'error' : 'ok'
  } catch (_error) {
    checks.supabase = 'error'
  }

  // Check Redis connection
  try {
    await redisClient.ping()
    checks.redis = 'ok'
  } catch (_error) {
    checks.redis = 'error'
  }

  const allOk = Object.values(checks).every(status => status === 'ok')

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  })
})
