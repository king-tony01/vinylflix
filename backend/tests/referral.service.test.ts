import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/prisma/client.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { MembershipService } from '../src/modules/memberships/membership.service.js';
import { ReferralService } from '../src/modules/referrals/referral.service.js';

describe('ReferralService - Qualification Engine & Milestone Unlocking', () => {
  let referrerId: string;
  let referrerCode: string;
  let basicPlanId: string;
  let premiumPlanId: string;
  let creatorPlanId: string;

  beforeAll(async () => {
    // 1. Ensure standard plans exist
    await MembershipService.ensureDefaultPlansAndConfig();
    const basicPlan = await prisma.membershipPlan.findUniqueOrThrow({ where: { tier: 'BASIC' } });
    const premiumPlan = await prisma.membershipPlan.findUniqueOrThrow({ where: { tier: 'PREMIUM' } });
    const creatorPlan = await prisma.membershipPlan.findUniqueOrThrow({ where: { tier: 'CREATOR' } });

    basicPlanId = basicPlan.id;
    premiumPlanId = premiumPlan.id;
    creatorPlanId = creatorPlan.id;

    // 2. Register referrer
    const referrerData = await AuthService.register({
      email: `referrer_upg_${Date.now()}@platform.internal`,
      username: `referrer_upg_${Date.now()}`,
      password: 'Password123!',
      fullName: 'Top Referrer',
    });
    referrerId = referrerData.user.id;
    referrerCode = referrerData.user.referralCode;

    // Activate BASIC membership for referrer (₦10,000 locked reward)
    await MembershipService.activateMembership(referrerId, basicPlanId);
  });

  afterAll(async () => {
    // Clean up created records
    await prisma.ledgerEntry.deleteMany({ where: { userId: referrerId } });
    await prisma.reward.deleteMany({ where: { userId: referrerId } });
    await prisma.referral.deleteMany({ where: { referrerId } });
    await prisma.membership.deleteMany({ where: { userId: referrerId } });
    await prisma.wallet.deleteMany({ where: { userId: referrerId } });
    await prisma.user.deleteMany({ where: { id: referrerId } });
  });

  it('should initialize referrer with ₦10,000 in LOCKED balance upon Basic activation', async () => {
    const stats = await ReferralService.getReferralStats(referrerId);
    expect(stats.stats.milestone.hasLockedReward).toBe(true);
    expect(stats.stats.milestone.lockedRewardAmount).toBe(10000);
    expect(stats.stats.milestone.targetRequirement).toBe(10);
    expect(stats.stats.milestone.qualifiedCount).toBe(0);

    const wallet = await prisma.wallet.findUnique({ where: { userId: referrerId } });
    expect(wallet?.lockedBalance).toBe(10000);
    expect(wallet?.availableBalance).toBe(0);
  });

  it('should preserve referral count and adjust locked reward to EXACTLY ₦25,000 (not ₦35,000) when upgrading to Premium', async () => {
    // Register 3 referrals before upgrading
    for (let i = 1; i <= 3; i++) {
      const ref = await AuthService.register({
        email: `pre_upg_${i}_${Date.now()}@platform.internal`,
        username: `pre_upg_${i}_${Date.now()}`,
        password: 'Password123!',
        referralCode: referrerCode,
      });
      await MembershipService.activateMembership(ref.user.id, basicPlanId);
      await ReferralService.evaluateReferralQualification(ref.user.id);
    }

    let stats = await ReferralService.getReferralStats(referrerId);
    expect(stats.stats.qualifiedReferrals).toBe(3);

    // Now user upgrades from Basic to Premium!
    await MembershipService.activateMembership(referrerId, premiumPlanId);

    // 1. Referral count should still be 3 (preserved!)
    stats = await ReferralService.getReferralStats(referrerId);
    expect(stats.stats.qualifiedReferrals).toBe(3);
    expect(stats.stats.isCreator).toBe(false);
    expect(stats.stats.userTier).toBe('PREMIUM');

    // 2. Locked balance should be ₦25,000 (NOT ₦35,000!)
    const wallet = await prisma.wallet.findUnique({ where: { userId: referrerId } });
    expect(wallet?.lockedBalance).toBe(25000);

    // 3. Milestone requires 5 Premium members
    expect(stats.stats.milestone.requiredPremiumCount).toBe(5);
    expect(stats.stats.milestone.premiumQualifiedCount).toBe(0);
  });

  it('should cease referral tracking and earnings when user upgrades to Creator tier', async () => {
    // Referrer upgrades to Creator
    await MembershipService.activateMembership(referrerId, creatorPlanId);

    const stats = await ReferralService.getReferralStats(referrerId);
    expect(stats.stats.isCreator).toBe(true);
    expect(stats.stats.userTier).toBe('CREATOR');

    // New referred user signs up and activates membership
    const refCreatorUser = await AuthService.register({
      email: `creator_ref_${Date.now()}@platform.internal`,
      username: `creator_ref_${Date.now()}`,
      password: 'Password123!',
      referralCode: referrerCode,
    });
    await MembershipService.activateMembership(refCreatorUser.user.id, basicPlanId);
    await ReferralService.evaluateReferralQualification(refCreatorUser.user.id);

    // Creator should not earn commissions
    const rewards = await prisma.reward.findMany({
      where: { userId: referrerId, sourceType: 'REFERRAL_REWARD' },
    });
    expect(rewards.length).toBe(0);
  });
});
