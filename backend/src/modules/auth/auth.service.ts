import { prisma } from '../../prisma/client.js';
import { hashPassword, comparePassword, generateReferralCode } from '../../utils/crypto.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from '../../utils/errors.js';
import { AuditService } from '../audit/audit.service.js';
import { RiskService } from '../risk/risk.service.js';
import { registerSchema, loginSchema } from './auth.dto.js';
import { z } from 'zod';

export class AuthService {
  public static async register(
    data: z.infer<typeof registerSchema>,
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Check duplicate email / username / phone
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          { username: data.username.toLowerCase() },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === data.email.toLowerCase()) {
        throw new ConflictError('An account with this email already exists');
      }
      if (existing.username.toLowerCase() === data.username.toLowerCase()) {
        throw new ConflictError('Username is already taken');
      }
      if (data.phone && existing.phone === data.phone) {
        throw new ConflictError('Phone number is already associated with another account');
      }
    }

    // 2. Validate referrer code if provided
    let referrerId: string | null = null;
    let validReferralCode: string | null = null;
    if (data.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: data.referralCode.toUpperCase() },
      });
      if (referrer) {
        referrerId = referrer.id;
        validReferralCode = referrer.referralCode;
      }
    }

    // 3. Generate unique referral code for the new user
    let userReferralCode = generateReferralCode(8);
    let isCodeUnique = false;
    while (!isCodeUnique) {
      const existingCode = await prisma.user.findUnique({ where: { referralCode: userReferralCode } });
      if (!existingCode) {
        isCodeUnique = true;
      } else {
        userReferralCode = generateReferralCode(8);
      }
    }

    const passwordHash = await hashPassword(data.password);

    // 4. Create user, profile, wallet, and referral record in an atomic transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          username: data.username.toLowerCase(),
          phone: data.phone || null,
          passwordHash,
          role: 'FREE_USER',
          status: 'ACTIVE',
          referralCode: userReferralCode,
          referredById: referrerId,
          profile: {
            create: {
              fullName: data.fullName || null,
            },
          },
          wallet: {
            create: {
              availableBalance: 0,
              pendingBalance: 0,
              lockedBalance: 0,
              totalEarned: 0,
              totalWithdrawn: 0,
              currency: 'NGN',
            },
          },
        },
        include: {
          profile: true,
          wallet: true,
        },
      });

      // If registered with valid referral, record pending referral relationship
      if (referrerId && validReferralCode) {
        await tx.referral.create({
          data: {
            referrerId,
            referredId: user.id,
            referralCode: validReferralCode,
            status: 'PENDING',
            qualificationReasons: JSON.stringify(['REGISTERED']),
          },
        });
      }

      return user;
    });

    // 5. Evaluate fraud/risk for new registration
    await RiskService.evaluateRisk({
      userId: newUser.id,
      entityType: 'AUTH',
      ipAddress,
      userAgent,
      metadata: { action: 'REGISTER', hasReferral: !!referrerId },
    });

    await AuditService.log({
      actorId: newUser.id,
      actorRole: newUser.role,
      action: 'USER_REGISTERED',
      targetType: 'USER',
      targetId: newUser.id,
      ipAddress,
    });

    const tokenPayload = { userId: newUser.id, role: newUser.role, email: newUser.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        referralCode: newUser.referralCode,
        profile: newUser.profile,
        wallet: newUser.wallet,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  public static async login(
    data: z.infer<typeof loginSchema>,
    ipAddress?: string,
    userAgent?: string
  ) {
    const rawIdentifier = data.login || data.email || data.username || '';
    const loginIdentifier = rawIdentifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: loginIdentifier }, { username: loginIdentifier }],
      },
      include: {
        profile: true,
        wallet: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email/username or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedError('Account is suspended. Please contact support.');
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email/username or password');
    }

    await AuditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetType: 'USER',
      targetId: user.id,
      ipAddress,
    });

    const tokenPayload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        profile: user.profile,
        wallet: user.wallet,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  public static async refreshToken(token: string) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || user.status === 'SUSPENDED') {
        throw new UnauthorizedError('User account not found or suspended');
      }

      const tokenPayload = { userId: user.id, role: user.role, email: user.email };
      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  public static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: true,
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const currentMembership = user.memberships[0] || null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      role: user.role,
      status: user.status,
      referralCode: user.referralCode,
      profile: user.profile,
      wallet: user.wallet,
      activeMembership: currentMembership,
      createdAt: user.createdAt,
    };
  }
}
