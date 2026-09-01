import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { WalletService } from './wallet.service.js';
import { LedgerService } from '../ledger/ledger.service.js';

export class WalletController {
  public static async getWallet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await WalletService.getWallet(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const bucket = req.query.bucket as string | undefined;

      const data = await WalletService.getTransactionHistory(req.user!.userId, {
        limit,
        offset,
        bucket,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async reconcile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LedgerService.reconcileWallet(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
