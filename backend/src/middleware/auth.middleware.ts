import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { prisma } from '../prisma/client.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & { status?: string };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid or expired authentication token'));
  }
}

export function requireRole(...allowedRoles: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // Admins have universal access
    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    // If endpoint allows CREATOR or ADVERTISER, also check if user has active CREATOR membership
    if (allowedRoles.includes('CREATOR') || allowedRoles.includes('ADVERTISER')) {
      const activeCreatorMembership = await prisma.membership.findFirst({
        where: {
          userId: req.user.userId,
          status: 'ACTIVE',
          plan: { tier: 'CREATOR' },
        },
      });
      if (activeCreatorMembership) {
        return next();
      }
    }

    return next(new ForbiddenError(`Access forbidden for role: ${req.user.role}`));
  };
}

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = verifyAccessToken(token);
    } catch {
      // Ignore token error for optional auth
    }
  }
  next();
}

export async function requireVerifiedEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  // Administrators bypass email verification check
  if (req.user.role === 'ADMIN' || req.user.role === 'FINANCE_RISK_ADMIN') {
    return next();
  }

  if (req.user.isEmailVerified === true) {
    return next();
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { isEmailVerified: true, email: true },
  });

  if (!user || !user.isEmailVerified) {
    return next(
      new ForbiddenError('Email verification required. Please verify your email address to access this feature.', {
        code: 'EMAIL_NOT_VERIFIED',
        email: user?.email || req.user.email,
      })
    );
  }

  req.user.isEmailVerified = true;
  next();
}

