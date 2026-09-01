import { Response, NextFunction } from 'express';
import { CampaignService } from './campaign.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class CampaignController {
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await CampaignService.createCampaign(req.user!.userId, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await CampaignService.getAdvertiserCampaigns(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status, reviewNote } = req.body;
      const data = await CampaignService.updateCampaignStatus(id, status, req.user!.userId, reviewNote);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
