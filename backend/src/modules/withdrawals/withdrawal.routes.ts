import { Router } from 'express';
import { WithdrawalController } from './withdrawal.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { requestWithdrawalSchema, processWithdrawalSchema } from './withdrawal.dto.js';

const router = Router();

router.post('/request', authenticate, validateBody(requestWithdrawalSchema), WithdrawalController.request);
router.get('/my', authenticate, WithdrawalController.getMyWithdrawals);
router.patch('/:id/review', authenticate, requireRole('ADMIN', 'FINANCE_RISK_ADMIN'), validateBody(processWithdrawalSchema), WithdrawalController.review);

export default router;
