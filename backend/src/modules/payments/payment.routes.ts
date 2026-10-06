import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Bank details endpoint (available for user frontend)
router.get('/bank-details', PaymentController.getBankDetails);
router.get('/banks', PaymentController.listBanks);
router.post('/resolve-account', PaymentController.resolveAccount);
router.get('/verify/:reference', PaymentController.verify);
router.post('/initialize', authenticate, PaymentController.initialize);
router.post('/manual-transfer', authenticate, PaymentController.submitManualTransfer);
router.get('/my-history', authenticate, PaymentController.getUserPayments);
router.post('/webhook/:provider', PaymentController.webhook);
router.post('/mock-simulate-success', PaymentController.simulatePaymentSuccess);

export default router;
