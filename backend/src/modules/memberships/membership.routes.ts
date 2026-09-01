import { Router } from 'express';
import { MembershipController } from './membership.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/plans', MembershipController.listPlans);
router.post('/purchase', authenticate, MembershipController.purchase);

export default router;
