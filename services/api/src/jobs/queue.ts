import Queue from 'bull';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Define job types
export interface SimulationJobData {
  simulationId: string;
  decisionId: string;
  optionId: string;
  userId: string;
}

// Create queues
export const simulationQueue = new Queue<SimulationJobData>('simulations', config.REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Queue event handlers
simulationQueue.on('completed', (job, result) => {
  logger.info(`Simulation job ${job.id} completed`, {
    simulationId: job.data.simulationId,
  });
});

simulationQueue.on('failed', (job, err) => {
  logger.error(`Simulation job ${job.id} failed`, {
    simulationId: job.data.simulationId,
    error: err.message,
  });
});

simulationQueue.on('stalled', (job) => {
  logger.warn(`Simulation job ${job.id} stalled`, {
    simulationId: job.data.simulationId,
  });
});

// Job management functions
export async function addSimulationJob(data: SimulationJobData) {
  const job = await simulationQueue.add(data, {
    priority: 1,
    delay: 0,
  });

  logger.info(`Added simulation job ${job.id}`, { data });
  return job;
}

export async function getJobStatus(jobId: string) {
  const job = await simulationQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    data: job.data,
    progress: job.progress(),
    state: await job.getState(),
    failedReason: job.failedReason,
  };
}

export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    simulationQueue.getWaitingCount(),
    simulationQueue.getActiveCount(),
    simulationQueue.getCompletedCount(),
    simulationQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
  };
}