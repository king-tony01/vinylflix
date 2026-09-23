import { prisma } from '../../prisma/client.js';
import { hashPassword, comparePassword, generateReferralCode, generateVerificationCode } from '../../utils/crypto.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { AppError, ConflictError, UnauthorizedError, NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { AuditService } from '../audit/audit.service.js';
import { RiskService } from '../risk/risk.service.js';
import { EmailService } from '../../services/email.service.js';
import { registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema } from './auth.dto.js';
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
    const verificationCode = generateVerificationCode(6);
    const emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

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
          isEmailVerified: false,
          emailVerificationCode: verificationCode,
          emailVerificationExpiresAt,
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

    // 5. Send verification email
    await EmailService.sendVerificationEmail(newUser.email, newUser.username, verificationCode);

    // 6. Evaluate fraud/risk for new registration
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

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        isEmailVerified: false,
        referralCode: newUser.referralCode,
        profile: newUser.profile,
        wallet: newUser.wallet,
      },
      requiresVerification: true,
      email: newUser.email,
      message: 'Registration successful! A 6-digit verification code has been sent to your email.',
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

    // Check if email is verified
    if (!user.isEmailVerified) {
      // If code is missing or expired, generate a new one and send email
      let code = user.emailVerificationCode;
      let expiresAt = user.emailVerificationExpiresAt;
      if (!code || !expiresAt || new Date() > expiresAt) {
        code = generateVerificationCode(6);
        expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationCode: code,
            emailVerificationExpiresAt: expiresAt,
          },
        });
        await EmailService.sendVerificationEmail(user.email, user.username, code);
      }

      throw new ForbiddenError(
        'Your email address is not verified. Please verify your email before logging in.',
        {
          code: 'EMAIL_NOT_VERIFIED',
          email: user.email,
          requiresVerification: true,
        }
      );
    }

    await AuditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetType: 'USER',
      targetId: user.id,
      ipAddress,
    });

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      isEmailVerified: true,
    };
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
        isEmailVerified: true,
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

  public static async verifyEmail(data: z.infer<typeof verifyEmailSchema>) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const inputCode = data.code.trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
        wallet: true,
      },
    });

    if (!user) {
      throw new NotFoundError('No account found with this email address');
    }

    if (user.isEmailVerified) {
      const tokenPayload = {
        userId: user.id,
        role: user.role,
        email: user.email,
        isEmailVerified: true,
      };
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
          isEmailVerified: true,
          referralCode: user.referralCode,
          profile: user.profile,
          wallet: user.wallet,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
        message: 'Email is already verified.',
      };
    }

    if (!user.emailVerificationCode || user.emailVerificationCode !== inputCode) {
      throw new ValidationError('Invalid verification code. Please check the 6-digit code and try again.');
    }

    if (!user.emailVerificationExpiresAt || new Date() > user.emailVerificationExpiresAt) {
      throw new ValidationError('Verification code has expired. Please request a new code.');
    }

    // Mark as verified & clear code
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
      },
      include: {
        profile: true,
        wallet: true,
      },
    });

    await AuditService.log({
      actorId: updatedUser.id,
      actorRole: updatedUser.role,
      action: 'USER_EMAIL_VERIFIED',
      targetType: 'USER',
      targetId: updatedUser.id,
    });

    // Send onboarding quick-start guide to the newly verified user
    await EmailService.sendWelcomeVerifiedEmail(
      updatedUser.email,
      updatedUser.username,
      updatedUser.referralCode
    );

    const tokenPayload = {
      userId: updatedUser.id,
      role: updatedUser.role,
      email: updatedUser.email,
      isEmailVerified: true,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        phone: updatedUser.phone,
        role: updatedUser.role,
        status: updatedUser.status,
        isEmailVerified: true,
        referralCode: updatedUser.referralCode,
        profile: updatedUser.profile,
        wallet: updatedUser.wallet,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
      message: 'Email verified successfully! Welcome to Vinylflix.',
    };
  }

  public static async resendVerificationCode(data: z.infer<typeof resendVerificationSchema>) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundError('No account found with this email address');
    }

    if (user.isEmailVerified) {
      return {
        success: true,
        message: 'Your email address is already verified. You can log in directly.',
      };
    }

    // Rate limiting cooldown: If code was requested less than 60s ago
    if (user.emailVerificationExpiresAt) {
      const timeRemainingMs = user.emailVerificationExpiresAt.getTime() - Date.now();
      // Total duration was 15 mins (900s). If > 840s (14 mins) remains, it was requested < 60s ago
      if (timeRemainingMs > 14 * 60 * 1000) {
        const waitSeconds = Math.ceil((timeRemainingMs - 14 * 60 * 1000) / 1000);
        throw new AppError(`Please wait ${waitSeconds} seconds before requesting a new verification code.`, 429);
      }
    }

    const newCode = generateVerificationCode(6);
    const emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: newCode,
        emailVerificationExpiresAt,
      },
    });

    await EmailService.sendVerificationEmail(user.email, user.username, newCode);

    return {
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
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

      if (!user.isEmailVerified) {
        throw new UnauthorizedError('Email verification required');
      }

      const tokenPayload = {
        userId: user.id,
        role: user.role,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      };
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
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      referralCode: user.referralCode,
      profile: user.profile,
      wallet: user.wallet,
      activeMembership: currentMembership,
      createdAt: user.createdAt,
    };
  }
}

