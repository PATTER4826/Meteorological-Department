/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Standalone 24/7 Alert Background Worker Entry Point
 * Designed for dedicated Render Background Workers or container tasks.
 */

import dotenv from 'dotenv';
import { alertWorker } from './worker/alert.worker.ts';
import { logger } from './utils/logger.ts';

dotenv.config();

logger.info('====================================================');
logger.info('🇹🇭 THAI WEATHER & DISASTER AI CENTER - ALERT WORKER');
logger.info('Mode: Dedicated Background Worker (24/7 Autonomous)');
logger.info('====================================================');

// Start the worker
alertWorker.start().catch((err) => {
  logger.error(`Critical error starting Alert Worker: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown handling
const handleGracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);
  await alertWorker.stop();
  logger.info('Worker process exited safely.');
  process.exit(0);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
