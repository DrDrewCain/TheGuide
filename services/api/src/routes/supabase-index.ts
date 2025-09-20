import { Router } from 'express';
import { authRouter } from './supabase-auth.routes.js';
import { userRouter } from './supabase-user.routes.js';
import { decisionRouter } from './supabase-decision.routes.js';
import { simulationRouter } from './supabase-simulation.routes.js';
import decisionAnalysisRouter from './decision-analysis.js';
import { healthRouter } from './health.routes.js';

export const supabaseRouter = Router();

// Health check (no auth required)
supabaseRouter.use('/health', healthRouter);

// Mount route modules
supabaseRouter.use('/auth', authRouter);
supabaseRouter.use('/users', userRouter);
supabaseRouter.use('/decisions', decisionRouter);
supabaseRouter.use('/simulations', simulationRouter);
supabaseRouter.use('/decisions', decisionAnalysisRouter);

// API info
supabaseRouter.get('/', (req, res) => {
  res.json({
    name: 'TheGuide API (Supabase)',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      decisions: '/api/decisions',
      simulations: '/api/simulations',
    },
  });
});