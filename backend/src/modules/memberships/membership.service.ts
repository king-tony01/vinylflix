import { prisma } from '../../prisma/client.js';
import { NotFoundError, AppError } from '../../utils/errors.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PaymentService } from '../payments/payment.service.js';
import { ReferralService } from '../referrals/referral.service.js';
import { AuditService } from '../audit/audit.service.js';
import { logger } from '../../utils/logger.js';

export class MembershipService {
  public static async listPlans() {
    return prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  public static async getPlan(planId: string) {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundError('Membership plan not found');
    return plan;
  }

  public static async purchaseMembership(userId: string, planId: string, idempotencyKey?: string) {
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
