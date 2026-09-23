import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '../src/prisma/client.js';
import { AuthService } from '../src/modules/auth/auth.service.js';

describe('AuthService - Email Verification & Security Gating', () => {
  const testEmail = `verify_test_${Date.now()}@example.com`;
  const testUsername = `verify_user_${Date.now()}`;
  const testPassword = 'Password123!';
  let createdUserId: string;

  afterAll(async () => {
    if (createdUserId) {
      await prisma.auditLog.deleteMany({ where: { actorId: createdUserId } });
      await prisma.riskEvent.deleteMany({ where: { userId: createdUserId } });
      await prisma.wallet.deleteMany({ where: { userId: createdUserId } });
      await prisma.profile.deleteMany({ where: { userId: createdUserId } });
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
  });

  it('1. should register a new user with isEmailVerified = false and generate a 6-digit OTP', async () => {
    const res = await AuthService.register({
      email: testEmail,
      username: testUsername,
      password: testPassword,
      fullName: 'Verification Test User',
    });

    expect(res.user).toBeDefined();
    expect(res.user.email).toBe(testEmail);
    expect(res.user.isEmailVerified).toBe(false);
    expect(res.requiresVerification).toBe(true);
    createdUserId = res.user.id;

    // Verify DB record
    const userInDb = await prisma.user.findUnique({ where: { id: createdUserId } });
    expect(userInDb).toBeDefined();
    expect(userInDb?.isEmailVerified).toBe(false);
    expect(userInDb?.emailVerificationCode).toMatch(/^\d{6}$/);
    expect(userInDb?.emailVerificationExpiresAt).toBeDefined();
  });

  it('2. should reject login for unverified user with EMAIL_NOT_VERIFIED code', async () => {
    await expect(
      AuthService.login({
        login: testEmail,
        password: testPassword,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      details: expect.objectContaining({
        code: 'EMAIL_NOT_VERIFIED',
        email: testEmail,
        requiresVerification: true,
      }),
    });
  });

  it('3. should reject verification with incorrect code', async () => {
    await expect(
      AuthService.verifyEmail({
        email: testEmail,
        code: '000000',
      })
    ).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringContaining('Invalid verification code'),
    });
  });

  it('4. should successfully verify email with the correct 6-digit code and issue tokens', async () => {
    const userInDb = await prisma.user.findUnique({ where: { id: createdUserId } });
    const validCode = userInDb?.emailVerificationCode!;

    const verifyRes = await AuthService.verifyEmail({
      email: testEmail,
      code: validCode,
    });

    expect(verifyRes.user.isEmailVerified).toBe(true);
    expect(verifyRes.tokens).toBeDefined();
    expect(verifyRes.tokens.accessToken).toBeDefined();
    expect(verifyRes.tokens.refreshToken).toBeDefined();

    // Verify DB status
    const verifiedUserInDb = await prisma.user.findUnique({ where: { id: createdUserId } });
    expect(verifiedUserInDb?.isEmailVerified).toBe(true);
    expect(verifiedUserInDb?.emailVerifiedAt).toBeDefined();
    expect(verifiedUserInDb?.emailVerificationCode).toBeNull();
  });

  it('5. should allow login now that email is verified', async () => {
    const loginRes = await AuthService.login({
      login: testEmail,
      password: testPassword,
    });

    expect(loginRes.user.isEmailVerified).toBe(true);
    expect(loginRes.tokens.accessToken).toBeDefined();
  });

  it('6. should return verified message if verifyEmail is called on an already verified account', async () => {
    const res = await AuthService.verifyEmail({
      email: testEmail,
      code: '123456',
    });

    expect(res.user.isEmailVerified).toBe(true);
    expect(res.message).toContain('already verified');
    expect(res.tokens.accessToken).toBeDefined();
  });
});
