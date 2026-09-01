import { Response, NextFunction } from 'express';
import { WithdrawalService } from './withdrawal.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class WithdrawalController {
  public static async request(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || (req.headers['x-forwarded-for'] as string);
      const data = await WithdrawalService.requestWithdrawal(req.user!.userId, req.body, ip);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyWithdrawals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await WithdrawalService.getUserWithdrawals(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async review(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { action, reviewNote } = req.body;
      const data = await WithdrawalService.processWithdrawalReview(
        id,
        req.user!.userId,
        action,
        reviewNote
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
