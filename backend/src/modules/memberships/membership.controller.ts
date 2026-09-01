import { Request, Response, NextFunction } from 'express';
import { MembershipService } from './membership.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class MembershipController {
  public static async listPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await MembershipService.listPlans();
      res.json({ success: true, data: { plans } });
    } catch (error) {
      next(error);
    }
  }

  public static async purchase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { planId, idempotencyKey } = req.body;
      const data = await MembershipService.purchaseMembership(req.user!.userId, planId, idempotencyKey);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
