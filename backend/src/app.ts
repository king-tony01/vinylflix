import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import membershipRoutes from './modules/memberships/membership.routes.js';
import referralRoutes from './modules/referrals/referral.routes.js';
import walletRoutes from './modules/wallet/wallet.routes.js';
import youtubeRoutes from './modules/youtube/youtube.routes.js';
import videoRoutes from './modules/videos/video.routes.js';
import campaignRoutes from './modules/campaigns/campaign.routes.js';
import watchSessionRoutes from './modules/watch-sessions/watch-session.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import withdrawalRoutes from './modules/withdrawals/withdrawal.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

import { errorHandler } from './middleware/error.middleware.js';
import { NotFoundError } from './utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  app.use(
    cors({
      origin: '*', // Configurable for production
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Signature', 'verif-hash', 'x-paystack-signature'],
    })
  );

  // Rate limiting for sensitive operations
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, error: { message: 'Too many requests, please try again later.' } },
  });
  app.use('/api', apiLimiter);

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', app: 'Vinylflix', timestamp: new Date().toISOString() });
  });

  // API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/memberships', membershipRoutes);
  app.use('/api/v1/referrals', referralRoutes);
  app.use('/api/v1/wallet', walletRoutes);
  app.use('/api/v1/youtube', youtubeRoutes);
  app.use('/api/v1/videos', videoRoutes);
  app.use('/api/v1/campaigns', campaignRoutes);
  app.use('/api/v1/watch-sessions', watchSessionRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/withdrawals', withdrawalRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // 1. Serve Admin SPA build under /admin
  const adminDistPath = path.resolve(__dirname, '../../admin/dist');
  if (fs.existsSync(adminDistPath)) {
    app.use('/admin', express.static(adminDistPath));
    app.get('/admin/*', (req, res) => {
      res.sendFile(path.join(adminDistPath, 'index.html'));
    });
  }

  // 2. Serve Frontend SPA build under /
  const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }

  // 404 Handler for unmapped API endpoints
  app.use('/api/*', (req, res, next) => {
    next(new NotFoundError(`API Route ${req.method} ${req.originalUrl} not found`));
  });

  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
