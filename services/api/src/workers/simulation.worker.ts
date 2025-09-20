import { AdvancedSimulationEngine } from '@theguide/sim-engine';
import { prisma } from '../data/database.js';
import { simulationQueue, SimulationJobData } from '../jobs/queue.js';
import { logger } from '../utils/logger.js';
import {
  Decision,
  DecisionOption,
  UserProfile,
  SimulationResult
} from '@theguide/models';

// Process simulation jobs
simulationQueue.process(async (job) => {
  const { simulationId, decisionId, optionId, userId } = job.data;

  try {
    logger.info(`Processing simulation ${simulationId}`);

    // Update simulation status to running
    await prisma.simulation.update({
      where: { id: simulationId },
      data: {
        status: 'running',
        startedAt: new Date()
      },
    });

    // Fetch decision, option, and user profile
    const [decision, option, userProfile] = await Promise.all([
      prisma.decision.findUnique({ where: { id: decisionId } }),
      prisma.decisionOption.findUnique({ where: { id: optionId } }),
      prisma.userProfile.findUnique({ where: { userId } })
    ]);

    if (!decision || !option) {
      throw new Error('Decision or option not found');
    }

    // Initialize simulation engine
    const engine = new AdvancedSimulationEngine(`worker-${simulationId}`);

    // Configure simulation based on user preferences or defaults
    const config = {
      targetScenarios: 1000,
      useQMC: true,
      useMLMC: true,
      useCopulas: true,
      reduceScenarios: true,
      runSensitivity: true,
      sensitivitySamples: 512
    };

    // Run simulation with progress updates
    const result = await engine.runAdvancedSimulation(
      decision as Decision,
      option as DecisionOption,
      userProfile || {},
      config,
      async (progress) => {
        // Update job progress
        await job.progress(progress.percentage);

        // Optionally update simulation with progress info
        if (progress.percentage % 10 === 0) {
          await prisma.simulation.update({
            where: { id: simulationId },
            data: {
              progress: progress.percentage,
              metadata: {
                lastProgressUpdate: new Date(),
                currentStage: progress.step
              }
            }
          });
        }
      }
    );

    // Save simulation results
    await prisma.simulation.update({
      where: { id: simulationId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        progress: 100,
        results: result as any, // Store the entire result object
        metadata: {
          engineConfig: config,
          processingTime: Date.now() - job.timestamp
        }
      },
    });

    logger.info(`Simulation ${simulationId} completed successfully`);
    return { simulationId, status: 'completed' };

  } catch (error) {
    logger.error(`Simulation ${simulationId} failed:`, error);

    // Update simulation status to failed
    await prisma.simulation.update({
      where: { id: simulationId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          errorStack: error instanceof Error ? error.stack : undefined
        }
      },
    });

    throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing simulation worker...');
  await simulationQueue.close();
  process.exit(0);
});