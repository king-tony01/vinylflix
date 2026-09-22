import { Response, NextFunction } from 'express';
import { WatchSessionService } from './watch-session.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class WatchSessionController {
  public static async start(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { videoId, campaignId, deviceFingerprint } = req.body;
      const ip = req.ip || (req.headers['x-forwarded-for'] as string);
      const userAgent = req.headers['user-agent'];

      const data = await WatchSessionService.startSession(
        req.user!.userId,
        videoId,
        campaignId,
        deviceFingerprint,
        ip,
        userAgent
      );

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async heartbeat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { sessionToken, currentPositionSeconds, playbackState } = req.body;
      const data = await WatchSessionService.recordHeartbeat(
        sessionToken,
        currentPositionSeconds,
        playbackState
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async complete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { sessionToken, finalPositionSeconds } = req.body;
      const ip = req.ip || (req.headers['x-forwarded-for'] as string);
      const userAgent = req.headers['user-agent'];

      const data = await WatchSessionService.completeSession(
        sessionToken,
        finalPositionSeconds,
        ip,
        userAgent
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getDailyStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await WatchSessionService.getUserDailyWatchStats(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
