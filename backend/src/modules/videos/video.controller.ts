import { Request, Response, NextFunction } from 'express';
import { VideoService } from './video.service.js';

export class VideoController {
  public static async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const search = req.query.search as string | undefined;

      const data = await VideoService.getFeed({ limit, offset, search });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await VideoService.getVideoDetails(id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
