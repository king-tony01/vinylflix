import { Response, NextFunction } from 'express';
import { ReferralService } from './referral.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class ReferralController {
  public static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReferralService.getReferralStats(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
