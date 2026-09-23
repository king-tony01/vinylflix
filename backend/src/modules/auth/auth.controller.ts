import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || (req.headers['x-forwarded-for'] as string);
      const userAgent = req.headers['user-agent'];
      const data = await AuthService.register(req.body, ip, userAgent);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || (req.headers['x-forwarded-for'] as string);
      const userAgent = req.headers['user-agent'];
      const data = await AuthService.login(req.body, ip, userAgent);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.refreshToken(req.body.refreshToken);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.verifyEmail(req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.resendVerificationCode(req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AuthService.getMe(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
