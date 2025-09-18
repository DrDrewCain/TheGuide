import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

// Create a single instance of PrismaClient
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug('Query:', { query: e.query, duration: e.duration });
  });
}

// Log errors
prisma.$on('error', (e: any) => {
  logger.error('Database error:', e);
});

// Connect to database
export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

// Disconnect from database
export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Disconnected from PostgreSQL database');
}

// Export the Prisma client instance
export { prisma };