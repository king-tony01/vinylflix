import { prisma } from '../../prisma/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { AuditService } from '../audit/audit.service.js';
import { logger } from '../../utils/logger.js';
import { NotFoundError } from '../../utils/errors.js';

export class ReferralService {
  /**
   * Returns referral statistics, unique link, and milestone progress for user.
   */
  public static async getReferralStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
        },
        referralsMade: {
          include: {
            referred: {
              select: {
                id: true,
                username: true,
                createdAt: true,
                memberships: {
                  where: { status: 'ACTIVE' },
                  include: { plan: true },
                  take: 1,
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundError('User not found');

    const totalReferrals = user.referralsMade.length;
    const qualifiedReferrals = user.referralsMade.filter((r) => r.status === 'QUALIFIED').length;
    const pendingReferrals = user.referralsMade.filter((r) => r.status === 'PENDING').length;

    // Count qualified referrals whose active membership tier is PREMIUM
    const premiumQualifiedReferrals = user.referralsMade.filter(
      (r) =>
        r.status === 'QUALIFIED' &&
        r.referred.memberships.some((m) => m.status === 'ACTIVE' && m.plan.tier === 'PREMIUM')
    ).length;

    const activeMembership = user.memberships[0];
    const userTier = activeMembership?.plan?.tier || (user.role === 'CREATOR' ? 'CREATOR' : 'FREE_STARTER');
    const isCreator = user.role === 'CREATOR' || userTier === 'CREATOR';
    const isPremium = userTier === 'PREMIUM';

    // Fetch active conditional reward and its progress requirement
    const lockedReward = await prisma.reward.findFirst({
      where: {
        userId,
        status: 'LOCKED',
        sourceType: 'MEMBERSHIP_REWARD',
      },
      orderBy: { createdAt: 'desc' },
    });

    let targetRequirement = 10;
    let requiredPremiumCount = isPremium ? 5 : 0;

    if (lockedReward?.lockedConditionJson) {
      try {
        const cond = JSON.parse(lockedReward.lockedConditionJson);
        targetRequirement = cond.requiredQualifiedReferrals || 10;
        requiredPremiumCount = cond.requiredPremiumReferrals !== undefined ? cond.requiredPremiumReferrals : (isPremium ? 5 : 0);
      } catch {}
    }

    const hasLockedReward = !!lockedReward;
    const remainingTotalToUnlock = hasLockedReward ? Math.max(0, targetRequirement - qualifiedReferrals) : 0;
    const remainingPremiumToUnlock = hasLockedReward && requiredPremiumCount > 0 ? Math.max(0, requiredPremiumCount - premiumQualifiedReferrals) : 0;
    const isSatisfied = qualifiedReferrals >= targetRequirement && premiumQualifiedReferrals >= requiredPremiumCount;

    const progressPercent = hasLockedReward
      ? Math.min(100, Math.round((qualifiedReferrals / targetRequirement) * 100))
      : 100;

    return {
      referralCode: user.referralCode,
      referralLink: `/register?ref=${user.referralCode}`,
      stats: {
        totalReferrals,
        qualifiedReferrals,
        pendingReferrals,
        premiumQualifiedReferrals,
        isCreator,
        userTier,
        milestone: {
          targetRequirement,
          qualifiedCount: qualifiedReferrals,
          requiredPremiumCount,
          premiumQualifiedCount: premiumQualifiedReferrals,
          remainingToUnlock: remainingTotalToUnlock,
          remainingPremiumToUnlock,
          isSatisfied,
          progressPercent,
          hasLockedReward,
          lockedRewardAmount: lockedReward ? lockedReward.amount : 0,
          currency: lockedReward ? lockedReward.currency : 'NGN',
          baseCommissionPerReferral: 1000,
        },
      },
      referrals: user.referralsMade.map((r) => {
        const activeSub = r.referred.memberships[0];
        return {
          id: r.id,
          referredUsername: r.referred.username,
          status: r.status,
          hasActiveMembership: !!activeSub,
          membershipTier: activeSub?.plan?.tier || 'FREE',
          membershipName: activeSub?.plan?.name || 'Free Starter',
          isPremium: activeSub?.plan?.tier === 'PREMIUM',
          registeredAt: r.createdAt,
          qualifiedAt: r.qualifiedAt,
        };
      }),
    };
  }

  /**
   * Evaluates whether a referred user qualifies their referrer.
   * Runs server-side only upon membership activation and fraud checks.
   */
  public static async evaluateReferralQualification(referredUserId: string): Promise<boolean> {
    const referral = await prisma.referral.findUnique({
      where: { referredId: referredUserId },
      include: {
        referred: {
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
            },
            riskScore: true,
          },
        },
        referrer: {
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
            },
          },
        },
      },
    });

    if (!referral) {
      logger.info(`[REFERRAL] No referral relationship found for user ${referredUserId}`);
      return false;
    }

    if (referral.status === 'QUALIFIED') {
      logger.info(`[REFERRAL] Referral ${referral.id} already qualified`);
      return true;
    }

    // Qualification Criteria:
    // 1. Referred user has active paid membership
    const hasActivePaidMembership = referral.referred.memberships.length > 0;
    // 2. Account not suspended or critical fraud risk
    const isCleanAccount = referral.referred.status !== 'SUSPENDED' && (referral.referred.riskScore?.score || 0) < 80;
    // 3. Not a self-referral
    const isNotSelf = referral.referrerId !== referral.referredId;

    if (hasActivePaidMembership && isCleanAccount && isNotSelf) {
      // 1. Mark referral as QUALIFIED
      await prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: 'QUALIFIED',
          qualificationReasons: JSON.stringify([
            'ACTIVE_MEMBERSHIP_SETTLED',
            'FRAUD_CHECKS_PASSED',
            'DISTINCT_ACCOUNT',
          ]),
          qualifiedAt: new Date(),
        },
      });

      logger.info(
        `[REFERRAL] Referral ${referral.id} QUALIFIED! Referrer: ${referral.referrerId}, Referred: ${referredUserId}`
      );

      await AuditService.log({
        actorId: referredUserId,
        action: 'REFERRAL_QUALIFIED',
        targetType: 'REFERRAL',
        targetId: referral.id,
        newState: { referrerId: referral.referrerId, status: 'QUALIFIED' },
      });

      // Check Referrer Status: If Creator, stop counting/granting referral commissions
      const referrerUser = referral.referrer;
      const isCreator =
        referrerUser.role === 'CREATOR' ||
        referrerUser.memberships.some((m) => m.status === 'ACTIVE' && m.plan.tier === 'CREATOR');

      if (isCreator) {
        logger.info(
          `[REFERRAL] Referrer ${referrerUser.id} is on CREATOR tier - referral tracking/earnings ceased.`
        );
        return true;
      }

      // 2. Check Referrer Milestone to unlock conditional reward if target reached
      await this.checkAndUnlockReferrerMilestones(referral.referrerId);

      // 3. Post-Milestone Ongoing Referral Commission: ₦1,000 per qualified referral
      // Check if referrer's milestone has been unlocked (no remaining LOCKED reward)
      const remainingLockedReward = await prisma.reward.findFirst({
        where: {
          userId: referral.referrerId,
          status: 'LOCKED',
          sourceType: 'MEMBERSHIP_REWARD',
        },
      });

      if (!remainingLockedReward) {
        // Milestone is unlocked! Award base earning of ₦1,000 directly to AVAILABLE balance
        const existingCommission = await prisma.reward.findFirst({
          where: {
            userId: referral.referrerId,
            sourceType: 'REFERRAL_REWARD',
            sourceId: referral.id,
          },
        });

        if (!existingCommission) {
          const reward = await prisma.reward.create({
            data: {
              userId: referral.referrerId,
              sourceType: 'REFERRAL_REWARD',
              sourceId: referral.id,
              amount: 1000,
              currency: 'NGN',
              status: 'AVAILABLE',
              unlockedAt: new Date(),
            },
          });

          await LedgerService.recordTransaction({
            userId: referral.referrerId,
            amount: 1000,
            currency: 'NGN',
            direction: 'CREDIT',
            bucket: 'AVAILABLE',
            entryType: 'REWARD_CREDIT',
            referenceType: 'REFERRAL',
            referenceId: referral.id,
            rewardId: reward.id,
            description: 'Referral commission bonus (₦1,000) for qualified member activation',
          });

          await prisma.notification.create({
            data: {
              userId: referral.referrerId,
              title: 'Referral Commission Earned! 🎉',
              message: 'You earned ₦1,000 available balance from a qualified referral activation.',
              type: 'REWARD',
            },
          });

          logger.info(
            `[REFERRAL COMMISSION] Credited ₦1,000 to Referrer ${referral.referrerId} for Referral ${referral.id}`
          );
        }
      }

      return true;
    } else {
      logger.info(
        `[REFERRAL] User ${referredUserId} does not satisfy qualification criteria yet. ActiveMembership: ${hasActivePaidMembership}, Clean: ${isCleanAccount}`
      );
      return false;
    }
  }

  /**
   * Checks if referrer has satisfied locked conditional reward milestones.
   */
  public static async checkAndUnlockReferrerMilestones(referrerId: string): Promise<boolean> {
    const qualifiedCount = await prisma.referral.count({
      where: {
        referrerId,
        status: 'QUALIFIED',
      },
    });

    // Count qualified referrals whose active membership tier is PREMIUM
    const premiumQualifiedCount = await prisma.referral.count({
      where: {
        referrerId,
        status: 'QUALIFIED',
        referred: {
          memberships: {
            some: {
              status: 'ACTIVE',
              plan: { tier: 'PREMIUM' },
            },
          },
        },
      },
    });

    const lockedRewards = await prisma.reward.findMany({
      where: {
        userId: referrerId,
        status: 'LOCKED',
        sourceType: 'MEMBERSHIP_REWARD',
      },
    });

    let anyUnlocked = false;

    for (const reward of lockedRewards) {
      let requiredCount = 10;
      let requiredPremiumCount = 0;

      if (reward.lockedConditionJson) {
        try {
          const cond = JSON.parse(reward.lockedConditionJson);
          requiredCount = cond.requiredQualifiedReferrals || 10;
          requiredPremiumCount = cond.requiredPremiumReferrals || 0;
          if (cond.planTier === 'PREMIUM' || reward.amount === 25000) {
            requiredPremiumCount = cond.requiredPremiumReferrals !== undefined ? cond.requiredPremiumReferrals : 5;
          }
        } catch {}
      } else if (reward.amount === 25000) {
        requiredPremiumCount = 5;
      }

      const satisfiesTotal = qualifiedCount >= requiredCount;
      const satisfiesPremium = premiumQualifiedCount >= requiredPremiumCount;

      if (satisfiesTotal && satisfiesPremium) {
        logger.info(
          `[MILESTONE UNLOCKED] Referrer ${referrerId} reached ${qualifiedCount}/${requiredCount} referrals (${premiumQualifiedCount}/${requiredPremiumCount} Premium)! Unlocking reward ${reward.id} (${reward.amount} ${reward.currency})`
        );

        // Perform double-entry transfer from LOCKED -> AVAILABLE
        await LedgerService.unlockConditionalReward(
          referrerId,
          reward.id,
          reward.amount,
          `Unlocked conditional reward of ${reward.amount} ${reward.currency} after achieving ${qualifiedCount} qualified referrals (${premiumQualifiedCount} Premium)`
        );

        // Record in-app notification
        await prisma.notification.create({
          data: {
            userId: referrerId,
            title: 'Conditional Milestone Reward Unlocked! 🎉',
            message: `Congratulations! You have satisfied your referral requirements (${qualifiedCount} qualified, ${premiumQualifiedCount} Premium). Your milestone bonus of ₦${reward.amount.toLocaleString()} is now available for withdrawal!`,
            type: 'REWARD',
          },
        });

        anyUnlocked = true;
      }
    }

    return anyUnlocked;
  }
}
