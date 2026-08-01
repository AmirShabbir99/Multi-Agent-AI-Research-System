'use strict';

const app = require('./src/app');
const config = require('./src/config/env');
const logger = require('./src/config/logger');
const { connectDB, disconnectDB } = require('./src/config/db');

let server;

async function start() {
  try {
    await connectDB();

    server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`, { env: config.env });
      logger.info(`API docs available at http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      logger.info('Shutdown complete.');
      process.exit(0);
    });
    // Force-exit if connections don't close in time
    setTimeout(() => process.exit(1), 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason?.message || reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception - shutting down', { error: error.message, stack: error.stack });
  process.exit(1);
});

start();
