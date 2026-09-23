import { Router } from 'express';
import { ReferralController } from './referral.controller.js';
import { authenticate, requireVerifiedEmail } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticate, requireVerifiedEmail, ReferralController.getStats);

export default router;
