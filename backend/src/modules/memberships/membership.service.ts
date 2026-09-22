import { prisma } from '../../prisma/client.js';
import { NotFoundError, AppError } from '../../utils/errors.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PaymentService } from '../payments/payment.service.js';
import { ReferralService } from '../referrals/referral.service.js';
import { AuditService } from '../audit/audit.service.js';
import { hashPassword } from '../../utils/crypto.js';
import { logger } from '../../utils/logger.js';

export class MembershipService {
  public static async listPlans() {
    let plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    // Auto-seed canonical plans on the fly if database is fresh / empty
    if (!plans || plans.length === 0) {
      await this.ensureDefaultPlansAndConfig();
      plans = await prisma.membershipPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });
    }

    return plans;
  }

  public static async ensureDefaultPlansAndConfig() {
    logger.info('[SEED] Checking platform configurations and standard membership tiers...');

    // 1. Platform Configs
    const configs = [
      { key: 'DEFAULT_CURRENCY', value: 'NGN', description: 'Platform primary currency' },
      { key: 'DEFAULT_MEMBERSHIP_PRICE', value: 3000, description: 'Basic membership price' },
      { key: 'DEFAULT_CONDITIONAL_REWARD', value: 10000, description: 'Basic conditional reward amount' },
      { key: 'DEFAULT_REFERRAL_REQUIREMENT', value: 10, description: 'Referrals required to unlock conditional reward' },
      { key: 'DEFAULT_MIN_WITHDRAWAL_AMOUNT', value: 2000, description: 'Minimum withdrawable balance' },
      { key: 'DEFAULT_MIN_WATCH_DURATION', value: 30, description: 'Minimum watch duration in seconds' },
      { key: 'DEFAULT_WATCH_REWARD_AMOUNT', value: 5, description: 'Reward amount per qualified view' },
      { key: 'PLATFORM_FEE_PERCENT', value: 5.0, description: 'Platform withdrawal processing fee percentage' },
    ];

    for (const c of configs) {
      await prisma.platformConfig.upsert({
        where: { key: c.key },
        create: {
          key: c.key,
          valueJson: JSON.stringify(c.value),
          description: c.description,
        },
        update: {
          valueJson: JSON.stringify(c.value),
        },
      });
    }

    // 2. Standard Membership Plans
    const standardPlans = [
      {
        name: 'Free Starter',
        tier: 'FREE_STARTER',
        price: 0,
        currency: 'NGN',
        durationDays: 365,
        benefits: ['Standard video feed access', 'Public content viewing', 'Explore creator campaigns'],
        conditionalRewardAmount: 0,
        referralRequirementCount: 0,
      },
      {
        name: 'Basic Member',
        tier: 'BASIC',
        price: 3000,
        currency: 'NGN',
        durationDays: 30,
        benefits: [
          'Earn cash rewards on campaign videos',
          '₦10,000 conditional milestone reward credit',
          'Referral bonuses & network tracking',
          'Direct bank payouts',
        ],
        conditionalRewardAmount: 10000,
        referralRequirementCount: 10,
      },
      {
        name: 'Premium Member',
        tier: 'PREMIUM',
        price: 7500,
        currency: 'NGN',
        durationDays: 30,
        benefits: [
          'Higher daily reward view limits',
          '₦25,000 conditional milestone reward credit',
          'Priority payout processing',
          'Exclusive high-yield video campaigns',
        ],
        conditionalRewardAmount: 25000,
        referralRequirementCount: 10,
      },
      {
        name: 'Creator / Advertiser Tier',
        tier: 'CREATOR',
        price: 15000,
        currency: 'NGN',
        durationDays: 30,
        benefits: [
          'Connect official YouTube channels',
          'Create targeted video promotion campaigns',
          'Comprehensive viewer analytics',
          'Monetization & audience growth tools',
        ],
        conditionalRewardAmount: 0,
        referralRequirementCount: 0,
      },
    ];

    for (const p of standardPlans) {
      await prisma.membershipPlan.upsert({
        where: { tier: p.tier },
        create: {
          name: p.name,
          tier: p.tier,
          price: p.price,
          currency: p.currency,
          durationDays: p.durationDays,
          benefitsJson: JSON.stringify(p.benefits),
          conditionalRewardAmount: p.conditionalRewardAmount,
          referralRequirementCount: p.referralRequirementCount,
          isActive: true,
        },
        update: {
          name: p.name,
          price: p.price,
          benefitsJson: JSON.stringify(p.benefits),
          conditionalRewardAmount: p.conditionalRewardAmount,
          referralRequirementCount: p.referralRequirementCount,
          isActive: true,
        },
      });
    }

    // 3. Super Administrator
    const adminPasswordHash = await hashPassword('AdminPassword123!');
    await prisma.user.upsert({
      where: { email: 'admin@platform.internal' },
      create: {
        email: 'admin@platform.internal',
        username: 'platform_admin',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        referralCode: 'ADMIN001',
        profile: {
          create: {
            fullName: 'Platform Super Administrator',
          },
        },
        wallet: {
          create: {
            availableBalance: 0,
            pendingBalance: 0,
            lockedBalance: 0,
            currency: 'NGN',
          },
        },
      },
      update: {
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    logger.info('[SEED] Standard platform membership tiers & admin account verified.');
  }

  public static async getPlan(planId: string) {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundError('Membership plan not found');
    return plan;
  }

  public static async purchaseMembership(userId: string, planId: string, idempotencyKey?: string, callbackUrl?: string) {
    const plan = await this.getPlan(planId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    // Initialize payment for membership
    return PaymentService.initializePayment({
      userId,
      amount: plan.price,
      currency: plan.currency,
      purpose: 'MEMBERSHIP_PURCHASE',
      metadata: { planId: plan.id, planTier: plan.tier },
      idempotencyKey,
      callbackUrl,
    });
  }

  public static async activateMembership(userId: string, planId: string, paymentId?: string) {
    const plan = await this.getPlan(planId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);

    const createdMembership = await prisma.$transaction(async (tx) => {
      // 1. Create or update Membership
      const membership = await tx.membership.create({
        data: {
          userId,
          planId: plan.id,
          status: 'ACTIVE',
          amountPaid: plan.price,
          currency: plan.currency,
          paymentId: paymentId || null,
          startsAt: new Date(),
          expiresAt,
        },
      });

      // 2. Update user role
      const newRole = plan.tier === 'CREATOR' ? 'CREATOR' : 'PAID_MEMBER';
      await tx.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      // 3. Issue Conditional Reward if configured for this plan
      if (plan.conditionalRewardAmount > 0) {
        const conditionData = {
          requiredQualifiedReferrals: plan.referralRequirementCount,
          membershipId: membership.id,
          description: `Requires ${plan.referralRequirementCount} qualified referrals to unlock`,
        };

        const reward = await tx.reward.create({
          data: {
            userId,
            sourceType: 'MEMBERSHIP_REWARD',
            sourceId: membership.id,
            amount: plan.conditionalRewardAmount,
            currency: plan.currency,
            status: 'LOCKED',
            lockedConditionJson: JSON.stringify(conditionData),
          },
        });

        // Record immutable ledger entry for CONDITIONAL_LOCK
        await LedgerService.recordTransaction(
          {
            userId,
            amount: plan.conditionalRewardAmount,
            currency: plan.currency,
            direction: 'CREDIT',
            bucket: 'LOCKED',
            entryType: 'CONDITIONAL_LOCK',
            referenceType: 'MEMBERSHIP',
            referenceId: membership.id,
            rewardId: reward.id,
            description: `Conditional membership credit locked: ${plan.conditionalRewardAmount} ${plan.currency}`,
          },
          tx
        );
      }

      await AuditService.log(
        {
          actorId: userId,
          actorRole: newRole,
          action: 'MEMBERSHIP_ACTIVATED',
          targetType: 'MEMBERSHIP',
          targetId: membership.id,
          newState: { planId: plan.id, tier: plan.tier, expiresAt },
        },
        tx
      );

      return membership;
    });

    // Trigger referral qualification check after transaction commits
    ReferralService.evaluateReferralQualification(userId).catch((err) =>
      logger.error(`Error in referral qualification trigger: ${err.message}`)
    );

    return createdMembership;
  }
}
