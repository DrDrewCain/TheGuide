import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { decisionRouter } from './decision.routes.js'
import { simulationRouter } from './simulation.routes.js'
import { userRouter } from './user.routes.js'

export const router = Router()

// Mount route modules
router.use('/auth', authRouter)
router.use('/users', userRouter)
router.use('/decisions', decisionRouter)
router.use('/simulations', simulationRouter)

// API info
router.get('/', (_req, res) => {
  res.json({
    name: 'TheGuide API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      decisions: '/api/decisions',
      simulations: '/api/simulations',
    },
  })
})
