import { Router } from 'express';
import { ReferralController } from './referral.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticate, ReferralController.getStats);

export default router;
