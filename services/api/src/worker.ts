#!/usr/bin/env node
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

// Import the worker to start processing
import './workers/simulation.worker.js';

logger.info('Simulation worker started', {
  nodeVersion: process.version,
  redisUrl: config.REDIS_URL ? 'configured' : 'missing'
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received');
  process.exit(0);
});