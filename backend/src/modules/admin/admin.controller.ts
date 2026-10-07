import { Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ConfigService } from '../config/config.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class AdminController {
  public static async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getDashboardMetrics();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;

      const data = await AdminService.listUsers({ search, role, status, limit, offset });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status, reason } = req.body;
      const data = await AdminService.updateUserStatus(id, status, req.user!.userId, reason || 'Status updated by admin');
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async reverseReward(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { rewardId, reason } = req.body;
      const data = await AdminService.reverseReward(rewardId, req.user!.userId, reason);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async listPendingWithdrawals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.listPendingWithdrawals();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const targetType = req.query.targetType as string | undefined;
      const targetId = req.query.targetId as string | undefined;

      const data = await AuditService.getLogs({ limit, offset, targetType, targetId });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getConfigs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await ConfigService.getAllConfigs();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async updateConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { key, value, description } = req.body;
      await ConfigService.set(key, value, description, req.user!.userId);
      res.json({ success: true, message: `Configuration for ${key} updated.` });
    } catch (error) {
      next(error);
    }
  }

  public static async listManualPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const { PaymentService } = await import('../payments/payment.service.js');
      const data = await PaymentService.listPendingManualPayments({ status, search, limit, offset });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async reviewManualPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { action, adminNote } = req.body;

      const { PaymentService } = await import('../payments/payment.service.js');
      const data = await PaymentService.reviewManualPayment({
        paymentId: id,
        adminId: req.user!.userId,
        action,
        adminNote,
      });

      res.json({
        success: true,
        message: action === 'APPROVE' ? 'Payment approved and membership activated.' : 'Payment rejected.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const data = await AdminService.listCampaigns({ status, search, limit, offset });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async reviewCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { action, reviewNote } = req.body;

      const data = await AdminService.reviewCampaign({
        campaignId: id,
        adminId: req.user!.userId,
        action,
        reviewNote,
      });

      res.json({
        success: true,
        message:
          action === 'APPROVE'
            ? 'Campaign approved and pushed live to video feed.'
            : action === 'REJECT'
            ? 'Campaign rejected.'
            : `Campaign status updated to ${action}.`,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listVideos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as string | undefined;
      const availabilityStatus = req.query.availabilityStatus as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const data = await AdminService.listVideos({ type, availabilityStatus, search, limit, offset });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async previewVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { videoUrlOrId } = req.body;
      if (!videoUrlOrId) {
        return res.status(400).json({ success: false, error: { message: 'Video URL or ID is required' } });
      }
      const data = await AdminService.previewVideo(videoUrlOrId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async addCuratedVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        videoUrlOrId,
        title,
        description,
        durationSeconds,
        thumbnailUrl,
        channelTitle,
        availabilityStatus,
      } = req.body;

      if (!videoUrlOrId) {
        return res.status(400).json({ success: false, error: { message: 'Video URL or ID is required' } });
      }

      const data = await AdminService.addCuratedVideo(req.user!.userId, {
        videoUrlOrId,
        title,
        description,
        durationSeconds,
        thumbnailUrl,
        channelTitle,
        availabilityStatus,
      });

      res.status(201).json({
        success: true,
        message: 'Video added to platform successfully and is now live on the discovery feed.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { title, description, availabilityStatus, durationSeconds } = req.body;

      const data = await AdminService.updateVideo(id, req.user!.userId, {
        title,
        description,
        availabilityStatus,
        durationSeconds,
      });

      res.json({
        success: true,
        message: 'Video updated successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await AdminService.deleteVideo(id, req.user!.userId);
      res.json({ success: true, message: 'Video removed from platform.', data });
    } catch (error) {
      next(error);
    }
  }
}
