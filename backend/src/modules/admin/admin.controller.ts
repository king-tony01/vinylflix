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
      const data = await AdminService.updatePlatformConfig(key, value, req.user!.userId, description);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
