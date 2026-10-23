import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { NotificationService } from './notification.service.js';

export class NotificationController {
  public static async getPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await NotificationService.getPreferences(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await NotificationService.updatePreferences(req.user!.userId, req.body);
      res.json({ success: true, data, message: 'Notification preferences synced with server' });
    } catch (error) {
      next(error);
    }
  }

  public static async registerDeviceToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token, platform } = req.body;
      const data = await NotificationService.registerDeviceToken(req.user!.userId, token, platform);
      res.json({ success: true, data, message: 'Device registered for push notifications' });
    } catch (error) {
      next(error);
    }
  }

  public static async removeDeviceToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      await NotificationService.removeDeviceToken(token);
      res.json({ success: true, message: 'Device token removed' });
    } catch (error) {
      next(error);
    }
  }

  public static async listNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const offset = parseInt(req.query.offset as string) || 0;
      const data = await NotificationService.listNotifications(req.user!.userId, limit, offset);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await NotificationService.markAsRead(req.user!.userId, id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await NotificationService.markAllAsRead(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async testPush(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title = 'Vinylflix Test Notification', message = 'Push notifications and preferences are functioning properly!', type = 'INFO' } = req.body;
      const data = await NotificationService.sendNotification({
        userId: req.user!.userId,
        title,
        message,
        type,
      });
      res.json({ success: true, data, message: 'Test notification triggered' });
    } catch (error) {
      next(error);
    }
  }
}
