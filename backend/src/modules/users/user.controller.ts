import { Response, NextFunction } from 'express';
import { UserService } from './user.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class UserController {
  public static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await UserService.updateProfile(req.user!.userId, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
