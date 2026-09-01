import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// All admin routes require ADMIN or FINANCE_RISK_ADMIN
router.use(authenticate, requireRole('ADMIN', 'FINANCE_RISK_ADMIN'));

router.get('/metrics', AdminController.getMetrics);
router.get('/users', AdminController.listUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.post('/rewards/reverse', AdminController.reverseReward);
router.get('/withdrawals/pending', AdminController.listPendingWithdrawals);
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/configs', AdminController.getConfigs);
router.post('/configs', AdminController.updateConfig);

export default router;
