import './config/env'; // Validate env vars first
import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { redis } from './config/redis';
import { startMatchingWorker } from './jobs/matching.worker';
import { startRevenueShareWorker, scheduleRevenueShareCron } from './jobs/revenueShare.worker';
import { env } from './config/env';
import { logger } from './config/logger';

const PORT = env.PORT;

async function bootstrap(): Promise<void> {
  // Start HTTP server immediately so Railway's healthcheck passes
  // while DB/Redis are still connecting
  const server = app.listen(PORT, () => {
    logger.info(`🚀 MediaLink Ghana API running on port ${PORT}`);
    logger.info(`📚 API docs: http://localhost:${PORT}/api/docs`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Graceful shutdown...`);
    server.close(async () => {
      await disconnectDatabase();
      await redis.quit();
      logger.info('Server closed. Goodbye!');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis (BullMQ may have already triggered the connection)
    if (redis.status === 'wait') {
      await redis.connect();
    }

    // Start BullMQ workers
    startMatchingWorker();
    startRevenueShareWorker();

    // Schedule cron jobs (revenue share monthly billing)
    scheduleRevenueShareCron();
  } catch (error) {
    logger.error('Failed to connect to database/Redis:', error);
    // Don't exit — server is already listening. Railway will keep the
    // container alive and the process can recover on the next request.
  }
}

bootstrap();
