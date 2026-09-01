import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/prisma/client.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { MembershipService } from '../src/modules/memberships/membership.service.js';
import { ReferralService } from '../src/modules/referrals/referral.service.js';

describe('ReferralService - Qualification Engine & Milestone Unlocking', () => {
  let referrerId: string;
  let referrerCode: string;
  let planId: string;

  beforeAll(async () => {
    // 1. Create a membership plan with conditional reward
    const plan = await prisma.membershipPlan.create({
      data: {
        name: `Test Plan ${Date.now()}`,
        tier: `BASIC_TEST_${Date.now()}`,
        price: 3000,
        currency: 'NGN',
        durationDays: 30,
        benefitsJson: JSON.stringify(['Test Benefit']),
        conditionalRewardAmount: 10000,
        referralRequirementCount: 2, // Milestone target of 2 for rapid test
        isActive: false,
      },
    });
    planId = plan.id;

    // 2. Register referrer
    const referrerData = await AuthService.register({
      email: `referrer_${Date.now()}@platform.internal`,
      username: `referrer_${Date.now()}`,
      password: 'Password123!',
      fullName: 'Top Referrer',
    });
    referrerId = referrerData.user.id;
    referrerCode = referrerData.user.referralCode;

    // Activate membership for referrer so they have a locked conditional reward of 10,000 NGN
    await MembershipService.activateMembership(referrerId, planId);
  });

  afterAll(async () => {
    // Clean up created records
    await prisma.ledgerEntry.deleteMany({ where: { userId: referrerId } });
    await prisma.reward.deleteMany({ where: { userId: referrerId } });
    await prisma.referral.deleteMany({ where: { referrerId } });
    await prisma.membership.deleteMany({ where: { planId } });
    await prisma.membershipPlan.deleteMany({ where: { id: planId } });
    await prisma.wallet.deleteMany({ where: { userId: referrerId } });
    await prisma.user.deleteMany({ where: { id: referrerId } });
  });

  it('should initialize referrer with ₦10,000 in LOCKED balance', async () => {
    const stats = await ReferralService.getReferralStats(referrerId);
    expect(stats.stats.milestone.hasLockedReward).toBe(true);
    expect(stats.stats.milestone.lockedRewardAmount).toBe(10000);
    expect(stats.stats.milestone.targetRequirement).toBe(2);
    expect(stats.stats.milestone.qualifiedCount).toBe(0);

    const wallet = await prisma.wallet.findUnique({ where: { userId: referrerId } });
    expect(wallet?.lockedBalance).toBe(10000);
    expect(wallet?.availableBalance).toBe(0);
  });

  it('should register a referred user and start referral in PENDING status', async () => {
    const referredUser = await AuthService.register({
      email: `referred_1_${Date.now()}@platform.internal`,
      username: `ref_user_1_${Date.now()}`,
      password: 'Password123!',
      referralCode: referrerCode,
    });

    const stats = await ReferralService.getReferralStats(referrerId);
    expect(stats.stats.totalReferrals).toBe(1);
    expect(stats.stats.pendingReferrals).toBe(1);
    expect(stats.stats.qualifiedReferrals).toBe(0);
    expect(stats.stats.milestone.remainingToUnlock).toBe(2);
  });

  it('should qualify referral when referred user purchases membership and unlock milestone when target reached', async () => {
    // Register 2 referred users with referral code
    const refUser1 = await AuthService.register({
      email: `referred_q1_${Date.now()}@platform.internal`,
      username: `ref_q1_${Date.now()}`,
      password: 'Password123!',
      referralCode: referrerCode,
    });

    const refUser2 = await AuthService.register({
      email: `referred_q2_${Date.now()}@platform.internal`,
      username: `ref_q2_${Date.now()}`,
      password: 'Password123!',
      referralCode: referrerCode,
    });

    // 1st referral membership activated
    await MembershipService.activateMembership(refUser1.user.id, planId);
    await ReferralService.evaluateReferralQualification(refUser1.user.id);

    let stats = await ReferralService.getReferralStats(referrerId);
    expect(stats.stats.qualifiedReferrals).toBe(1);
    expect(stats.stats.milestone.remainingToUnlock).toBe(1);

    // Referrer balance should still be locked at 1/2 referrals
    let wallet = await prisma.wallet.findUnique({ where: { userId: referrerId } });
    expect(wallet?.lockedBalance).toBe(10000);
    expect(wallet?.availableBalance).toBe(0);

    // 2nd referral membership activated (Milestone target reached: 2/2)
    await MembershipService.activateMembership(refUser2.user.id, planId);
    await ReferralService.evaluateReferralQualification(refUser2.user.id);

    stats = await ReferralService.getReferralStats(referrerId);
    expect(stats.stats.qualifiedReferrals).toBe(2);
    expect(stats.stats.milestone.remainingToUnlock).toBe(0);

    // Referrer's ₦10,000 conditional reward should now be unlocked to AVAILABLE balance!
    wallet = await prisma.wallet.findUnique({ where: { userId: referrerId } });
    expect(wallet?.lockedBalance).toBe(0);
    expect(wallet?.availableBalance).toBe(10000);
  });
});
