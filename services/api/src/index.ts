import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import morgan from 'morgan';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { connectRedis } from './data/redis.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/supabase-auth.routes.js';
import { userRouter } from './routes/supabase-user.routes.js';
import { decisionRouter } from './routes/supabase-decision.routes.js';
import { simulationRouter } from './routes/supabase-simulation.routes.js';

async function bootstrap() {
  // Initialize Express app
  const app = express();

  // Trust proxy - needed for rate limiting behind reverse proxies
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.CORS_ORIGINS.split(','),
    credentials: true
  }));

  // General middleware
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });

  app.use('/api/', limiter);

  // API Routes
  app.use('/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/decisions', decisionRouter);
  app.use('/api/simulations', simulationRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Connect to Redis for job queue
  await connectRedis();

  // Start server
  const server = app.listen(config.PORT, () => {
    logger.info(`API server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    logger.info('Supabase URL: ${config.SUPABASE_URL}');
    logger.info('Press Ctrl+C to quit.');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
bootstrap().catch(error => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});