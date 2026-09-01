import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { MembershipService } from './modules/memberships/membership.service.js';

const app = createApp();

async function startServer() {
  try {
    // Automatically ensure standard membership tiers and admin account exist
    await MembershipService.ensureDefaultPlansAndConfig();
  } catch (err: any) {
    logger.warn(`[BOOTSTRAP] Plan auto-check notice: ${err?.message || err}`);
  }

  const server = app.listen(config.port, () => {
    logger.info(`🚀 Vinylflix server running on port ${config.port} (${config.nodeEnv})`);
    logger.info(`🔗 Base URL: ${config.apiBaseUrl}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

startServer();
