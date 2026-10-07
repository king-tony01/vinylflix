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
          '₦10,000 milestone bonus (10 qualified referrals)',
          '₦1,000 base earning per referral after milestone',
          '₦5,000 min subsequent withdrawal threshold',
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
          '₦25,000 milestone bonus (10 referrals incl. 5 Premium)',
          '₦1,000 base earning per referral after milestone',
          '₦2,000 min subsequent withdrawal threshold',
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
    const adminEmail = 'vinylflix@gmail.com';
    const adminPasswordHash = await hashPassword('AdminPassword123!');

    // Clean up or migrate legacy placeholder admin if exists
    const legacyAdmin = await prisma.user.findUnique({ where: { email: 'admin@platform.internal' } });
    if (legacyAdmin) {
      const targetExists = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (!targetExists) {
        await prisma.user.update({
          where: { email: 'admin@platform.internal' },
          data: {
            email: adminEmail,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            status: 'ACTIVE',
            role: 'ADMIN',
          },
        }).catch(() => {});
      } else {
        await prisma.user.delete({ where: { email: 'admin@platform.internal' } }).catch(() => {});
      }
    }

    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        username: 'platform_admin',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
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
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // 4. Starter Entertainment Videos (if video library is empty)
    const existingVideoCount = await prisma.video.count({ where: { availabilityStatus: 'PUBLIC' } });
    if (existingVideoCount === 0) {
      const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (adminUser) {
        let channel = await prisma.youTubeConnection.findFirst({ where: { userId: adminUser.id } });
        if (!channel) {
          channel = await prisma.youTubeConnection.create({
            data: {
              userId: adminUser.id,
              channelId: 'UC_vinylflix_official_curated',
              channelTitle: 'Vinylflix Entertainment',
              channelThumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
              customUrl: '@vinylflix',
              accessTokenEncrypted: 'curated_seed_connection',
              isConnected: true,
              syncedAt: new Date(),
            },
          });
        }

        const starterVideos = [
          {
            youtubeVideoId: '4T7HwL272Tw',
            title: 'Rema, Selena Gomez - Calm Down (Official Music Video)',
            description: 'Official music video for Calm Down by Rema & Selena Gomez.',
            durationSeconds: 239,
            thumbnailUrl: 'https://i.ytimg.com/vi/4T7HwL272Tw/hqdefault.jpg',
            availabilityStatus: 'PUBLIC',
          },
          {
            youtubeVideoId: 'L_LUpnjgPso',
            title: 'Burna Boy - Last Last [Official Music Video]',
            description: 'Official Music Video for Burna Boy - Last Last from the Love, Damini album.',
            durationSeconds: 174,
            thumbnailUrl: 'https://i.ytimg.com/vi/L_LUpnjgPso/hqdefault.jpg',
            availabilityStatus: 'PUBLIC',
          },
          {
            youtubeVideoId: 'hT_nvWreIhg',
            title: 'Asake - Lonely At The Top (Official Video)',
            description: 'Official music video for Lonely At The Top by Asake.',
            durationSeconds: 156,
            thumbnailUrl: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
            availabilityStatus: 'PUBLIC',
          },
          {
            youtubeVideoId: 'JFcgOboQZ08',
            title: 'Lofi Hip Hop Radio - Beats to Relax / Study to',
            description: 'Peaceful lofi hip hop beats for focus, work, and relaxation.',
            durationSeconds: 300,
            thumbnailUrl: 'https://i.ytimg.com/vi/JFcgOboQZ08/hqdefault.jpg',
            availabilityStatus: 'PUBLIC',
          },
          {
            youtubeVideoId: 'kJQP7kiw5Fk',
            title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
            description: 'Official music video for Despacito by Luis Fonsi.',
            durationSeconds: 282,
            thumbnailUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
            availabilityStatus: 'PUBLIC',
          },
        ];

        for (const sv of starterVideos) {
          await prisma.video.upsert({
            where: { youtubeVideoId: sv.youtubeVideoId },
            create: {
              ...sv,
              channelId: channel.id,
              lastCheckedAt: new Date(),
            },
            update: {
              availabilityStatus: 'PUBLIC',
            },
          });
        }
        logger.info('[SEED] Seeded starter entertainment videos for discovery feed.');
      }
    }

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
      // 1. Mark previous active memberships as superseded
      await tx.membership.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });

      // 2. Create new Membership
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

      // 3. Update user role
      const newRole = plan.tier === 'CREATOR' ? 'CREATOR' : 'PAID_MEMBER';
      await tx.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      // 4. Handle Conditional Reward with clean upgrade adjustment
      if (plan.conditionalRewardAmount > 0) {
        const isPremium = plan.tier === 'PREMIUM';
        const requiredPremiumReferrals = isPremium ? 5 : 0;
        const conditionData = {
          requiredQualifiedReferrals: plan.referralRequirementCount,
          requiredPremiumReferrals,
          planTier: plan.tier,
          membershipId: membership.id,
          description: isPremium
            ? `Requires ${plan.referralRequirementCount} qualified referrals including at least ${requiredPremiumReferrals} Premium members`
            : `Requires ${plan.referralRequirementCount} qualified referrals to unlock`,
        };

        // Check if user already has an existing LOCKED membership reward
        const existingLockedReward = await tx.reward.findFirst({
          where: {
            userId,
            status: 'LOCKED',
            sourceType: 'MEMBERSHIP_REWARD',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (existingLockedReward) {
          // UPGRADE FLOW: Adjust existing locked balance to match new plan amount exactly (e.g. 10k -> 25k adds 15k, NOT 25k)
          const targetAmount = plan.conditionalRewardAmount;
          const delta = targetAmount - existingLockedReward.amount;

          if (delta > 0) {
            // Update reward record amount & condition
            await tx.reward.update({
              where: { id: existingLockedReward.id },
              data: {
                amount: targetAmount,
                sourceId: membership.id,
                lockedConditionJson: JSON.stringify(conditionData),
              },
            });

            // Credit only the delta (+₦15,000) to the LOCKED bucket
            await LedgerService.recordTransaction(
              {
                userId,
                amount: delta,
                currency: plan.currency,
                direction: 'CREDIT',
                bucket: 'LOCKED',
                entryType: 'CONDITIONAL_LOCK',
                referenceType: 'MEMBERSHIP',
                referenceId: membership.id,
                rewardId: existingLockedReward.id,
                description: `Membership upgrade locked credit adjustment (+${delta} ${plan.currency}) to target ${targetAmount} ${plan.currency}`,
              },
              tx
            );
          } else {
            // If delta <= 0, simply update condition
            await tx.reward.update({
              where: { id: existingLockedReward.id },
              data: {
                sourceId: membership.id,
                lockedConditionJson: JSON.stringify(conditionData),
              },
            });
          }
        } else {
          // FRESH ACTIVATION: Create new locked reward
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
