import { Router } from 'express';
import { WalletController } from './wallet.controller.js';
import { authenticate, requireVerifiedEmail } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireVerifiedEmail);

router.get('/', WalletController.getWallet);
router.get('/transactions', WalletController.getTransactions);
router.get('/reconcile', WalletController.reconcile);

export default router;
