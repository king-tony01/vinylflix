import { Router } from 'express';
import { MembershipController } from './membership.controller.js';
import { authenticate, requireVerifiedEmail } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/plans', MembershipController.listPlans);
router.post('/purchase', authenticate, requireVerifiedEmail, MembershipController.purchase);

export default router;
