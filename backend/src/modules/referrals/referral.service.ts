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
        referralsMade: {
          include: {
            referred: {
              select: {
                id: true,
                username: true,
                createdAt: true,
                memberships: {
                  where: { status: 'ACTIVE' },
                  take: 1,
                  select: { status: true, startsAt: true },
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

    // Fetch active conditional reward and its progress requirement
    const lockedReward = await prisma.reward.findFirst({
      where: {
        userId,
        status: 'LOCKED',
        sourceType: 'MEMBERSHIP_REWARD',
      },
      orderBy: { createdAt: 'desc' },
    });

    const latestReward = await prisma.reward.findFirst({
      where: {
        userId,
        sourceType: 'MEMBERSHIP_REWARD',
      },
      orderBy: { createdAt: 'desc' },
    });

    let targetRequirement = 10;
    const targetReward = lockedReward || latestReward;
    if (targetReward?.lockedConditionJson) {
      try {
        const cond = JSON.parse(targetReward.lockedConditionJson);
        targetRequirement = cond.requiredQualifiedReferrals || 10;
      } catch {}
    }

    const hasLockedReward = !!lockedReward;
    const remainingToUnlock = hasLockedReward ? Math.max(0, targetRequirement - qualifiedReferrals) : 0;
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
        milestone: {
          targetRequirement,
          qualifiedCount: qualifiedReferrals,
          remainingToUnlock,
          progressPercent,
          hasLockedReward: !!lockedReward,
          lockedRewardAmount: lockedReward ? lockedReward.amount : 0,
          currency: lockedReward ? lockedReward.currency : 'NGN',
        },
      },
      referrals: user.referralsMade.map((r) => ({
        id: r.id,
        referredUsername: r.referred.username,
        status: r.status,
        hasActiveMembership: r.referred.memberships.length > 0,
        registeredAt: r.createdAt,
        qualifiedAt: r.qualifiedAt,
      })),
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
            memberships: { where: { status: 'ACTIVE' } },
            riskScore: true,
          },
        },
        referrer: true,
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

      // 2. Check Referrer Milestone to unlock conditional reward if target reached
      await this.checkAndUnlockReferrerMilestones(referral.referrerId);

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
  public static async checkAndUnlockReferrerMilestones(referrerId: string) {
    const qualifiedCount = await prisma.referral.count({
      where: {
        referrerId,
        status: 'QUALIFIED',
      },
    });

    const lockedRewards = await prisma.reward.findMany({
      where: {
        userId: referrerId,
        status: 'LOCKED',
      },
    });

    for (const reward of lockedRewards) {
      let requiredCount = 10;
      if (reward.lockedConditionJson) {
        try {
          const cond = JSON.parse(reward.lockedConditionJson);
          requiredCount = cond.requiredQualifiedReferrals || 10;
        } catch {}
      }

      if (qualifiedCount >= requiredCount) {
        logger.info(
          `[MILESTONE UNLOCKED] Referrer ${referrerId} reached ${qualifiedCount}/${requiredCount} referrals! Unlocking reward ${reward.id} (${reward.amount} ${reward.currency})`
        );

        // Perform double-entry transfer from LOCKED -> AVAILABLE
        await LedgerService.unlockConditionalReward(
          referrerId,
          reward.id,
          reward.amount,
          `Unlocked conditional reward of ${reward.amount} ${reward.currency} after achieving ${qualifiedCount} qualified referrals`
        );

        // Record in-app notification
        await prisma.notification.create({
          data: {
            userId: referrerId,
            title: 'Conditional Reward Unlocked!',
            message: `Congratulations! You have reached ${qualifiedCount} qualified referrals. Your reward of ₦${reward.amount.toLocaleString()} is now withdrawable!`,
            type: 'REWARD',
          },
        });
      }
    }
  }
}
