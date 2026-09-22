import { prisma } from '../../prisma/client.js';
import { generateSessionToken } from '../../utils/crypto.js';
import { NotFoundError, AppError } from '../../utils/errors.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { CampaignService } from '../campaigns/campaign.service.js';
import { RiskService } from '../risk/risk.service.js';
import { logger } from '../../utils/logger.js';

export class WatchSessionService {
  /**
   * Initializes a server-tracked watch session.
   */
  public static async startSession(
    userId: string,
    videoId: string,
    campaignId?: string,
    deviceFingerprint?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video) throw new NotFoundError('Video not found');

    let activeCampaignId: string | null = null;
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });
      if (campaign && campaign.status === 'ACTIVE' && campaign.remainingBudget > 0) {
        activeCampaignId = campaign.id;
      }
    }

    const sessionToken = generateSessionToken();

    const session = await prisma.watchSession.create({
      data: {
        userId,
        videoId: video.id,
        campaignId: activeCampaignId,
        sessionToken,
        startedAt: new Date(),
        watchDurationSeconds: 0,
        heartbeatCount: 0,
        lastHeartbeatAt: new Date(),
        qualificationStatus: 'IN_PROGRESS',
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        deviceFingerprint: deviceFingerprint || null,
      },
    });

    logger.info(`[WATCH SESSION] Started session ${session.id} for user ${userId}, video ${videoId}`);

    return {
      sessionId: session.id,
      sessionToken: session.sessionToken,
      campaignId: session.campaignId,
    };
  }

  /**
   * Records periodic heartbeat events to verify continuous viewing.
   */
  public static async recordHeartbeat(
    sessionToken: string,
    currentPositionSeconds: number,
    playbackState: string
  ) {
    const session = await prisma.watchSession.findUnique({
      where: { sessionToken },
    });

    if (!session) throw new NotFoundError('Watch session not found');
    if (session.qualificationStatus !== 'IN_PROGRESS') {
      return { status: session.qualificationStatus };
    }

    const now = new Date();
    const elapsedSecondsSinceLastHeartbeat = Math.floor(
      (now.getTime() - session.lastHeartbeatAt.getTime()) / 1000
    );

    const positionDelta = Math.max(0, currentPositionSeconds - session.watchDurationSeconds);
    const durationIncrement =
      playbackState === 'PLAYING'
        ? Math.min(Math.max(elapsedSecondsSinceLastHeartbeat, positionDelta), 15)
        : 0;

    const updated = await prisma.watchSession.update({
      where: { id: session.id },
      data: {
        watchDurationSeconds: { increment: durationIncrement },
        heartbeatCount: { increment: 1 },
        lastHeartbeatAt: now,
      },
      include: {
        campaign: true,
      },
    });

    // Check if session has satisfied campaign watch duration and auto-qualify
    if (
      updated.campaign &&
      updated.campaign.status === 'ACTIVE' &&
      updated.watchDurationSeconds >= updated.campaign.minWatchDurationSeconds
    ) {
      const completionResult = await this.completeSession(
        sessionToken,
        updated.watchDurationSeconds
      );
      return {
        watchDurationSeconds: updated.watchDurationSeconds,
        status: completionResult.qualificationStatus,
        isRewarded: completionResult.qualificationStatus === 'REWARDED',
        rewardCredited: completionResult.rewardEarned,
        message: completionResult.message,
      };
    }

    return {
      watchDurationSeconds: updated.watchDurationSeconds,
      status: updated.qualificationStatus,
    };
  }

  /**
   * Fetches the user's daily watch stats, today's earnings, and tier quota limits.
   */
  public static async getUserDailyWatchStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
        },
      },
    });

    if (!user) throw new NotFoundError('User not found');

    const activePlan = user.memberships[0]?.plan;
    const tier = activePlan?.tier || (user.role === 'CREATOR' ? 'CREATOR' : user.role === 'PAID_MEMBER' ? 'BASIC' : 'FREE');

    let maxDailyQuota = 0;
    if (tier === 'PREMIUM' || tier === 'CREATOR' || user.role === 'ADMIN') {
      maxDailyQuota = 15;
    } else if (tier === 'BASIC' || user.role === 'PAID_MEMBER') {
      maxDailyQuota = 8;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaySessions = await prisma.watchSession.findMany({
      where: {
        userId,
        qualificationStatus: 'REWARDED',
        createdAt: { gte: startOfDay },
      },
      include: {
        reward: true,
      },
    });

    const todayCompletedCount = todaySessions.length;
    const todayTotalEarned = todaySessions.reduce((sum, s) => sum + (s.reward?.amount || 0), 0);
    const remainingSlots = Math.max(0, maxDailyQuota - todayCompletedCount);

    return {
      tier,
      maxDailyQuota,
      todayCompletedCount,
      todayTotalEarned,
      remainingSlots,
      isQuotaReached: todayCompletedCount >= maxDailyQuota,
    };
  }

  /**
   * Completes watch session and processes server-side reward qualification.
   */
  public static async completeSession(
    sessionToken: string,
    finalPositionSeconds: number,
    ipAddress?: string,
    userAgent?: string
  ) {
    const session = await prisma.watchSession.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
              take: 1,
            },
          },
        },
        campaign: true,
        video: true,
      },
    });

    if (!session) throw new NotFoundError('Watch session not found');
    if (session.qualificationStatus !== 'IN_PROGRESS') {
      const existingReward = session.rewardId
        ? await prisma.reward.findUnique({ where: { id: session.rewardId } })
        : null;
      return {
        qualificationStatus: session.qualificationStatus,
        rewardEarned: existingReward?.amount || 0,
        message: `Session is already finalized (${session.qualificationStatus})`,
      };
    }

    const now = new Date();
    const wallClockElapsedSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);

    // 1. Anti-Cheat & Risk Evaluation
    const riskResult = await RiskService.evaluateRisk({
      userId: session.userId,
      entityType: 'WATCH_SESSION',
      entityId: session.id,
      ipAddress: ipAddress || session.ipAddress,
      userAgent: userAgent || session.userAgent,
      deviceFingerprint: session.deviceFingerprint,
      metadata: {
        reportedDuration: session.watchDurationSeconds,
        actualElapsedSeconds: wallClockElapsedSeconds,
        heartbeatCount: session.heartbeatCount,
      },
    });

    if (riskResult.isBlocked) {
      await prisma.watchSession.update({
        where: { id: session.id },
        data: {
          endedAt: now,
          qualificationStatus: 'DISQUALIFIED',
          disqualificationReason: `Risk engine blocked: ${riskResult.flags.join(', ')}`,
        },
      });
      return {
        qualificationStatus: 'DISQUALIFIED',
        rewardEarned: 0,
        message: 'Viewing activity could not be verified by anti-fraud system',
      };
    }

    // 2. Check if user has an active paid membership (Free users don't earn monetary viewing rewards)
    const isPaidMember = session.user.memberships.length > 0 || session.user.role === 'PAID_MEMBER' || session.user.role === 'CREATOR';
    if (!isPaidMember) {
      await prisma.watchSession.update({
        where: { id: session.id },
        data: {
          endedAt: now,
          qualificationStatus: 'DISQUALIFIED',
          disqualificationReason: 'Monetary rewards require an active membership plan',
        },
      });
      return {
        qualificationStatus: 'DISQUALIFIED',
        rewardEarned: 0,
        message: 'Completed watch session. Upgrade membership to earn cash rewards on campaign videos.',
      };
    }

    // 3. Check campaign eligibility & minimum watch duration
    if (!session.campaign || session.campaign.status !== 'ACTIVE') {
      await prisma.watchSession.update({
        where: { id: session.id },
        data: {
          endedAt: now,
          qualificationStatus: 'QUALIFIED',
          disqualificationReason: 'No active campaign reward associated',
        },
      });
      return {
        qualificationStatus: 'QUALIFIED',
        rewardEarned: 0,
        message: 'Watch session recorded (non-rewarded video)',
      };
    }

    const requiredDuration = session.campaign.minWatchDurationSeconds;
    if (session.watchDurationSeconds < requiredDuration) {
      await prisma.watchSession.update({
        where: { id: session.id },
        data: {
          endedAt: now,
          qualificationStatus: 'DISQUALIFIED',
          disqualificationReason: `Watch duration (${session.watchDurationSeconds}s) did not meet minimum requirement (${requiredDuration}s)`,
        },
      });
      return {
        qualificationStatus: 'DISQUALIFIED',
        rewardEarned: 0,
        message: `Watch duration was less than the required ${requiredDuration} seconds`,
      };
    }

    // 4. Check Daily Limit for user's tier and on this campaign
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const userTier =
      session.user.memberships[0]?.plan?.tier ||
      (session.user.role === 'CREATOR'
        ? 'CREATOR'
        : session.user.role === 'PAID_MEMBER'
        ? 'BASIC'
        : 'FREE');
    const tierMaxDailyQuota =
      userTier === 'PREMIUM' || userTier === 'CREATOR' || session.user.role === 'ADMIN'
        ? 15
        : 8;

    const todayTotalUserRewardedViews = await prisma.watchSession.count({
      where: {
        userId: session.userId,
        qualificationStatus: 'REWARDED',
        createdAt: { gte: startOfDay },
      },
    });

    if (todayTotalUserRewardedViews >= tierMaxDailyQuota) {
      await prisma.watchSession.update({
        where: { id: session.id },
        data: {
          endedAt: now,
          qualificationStatus: 'DISQUALIFIED',
          disqualificationReason: `Daily rewarded video limit (${tierMaxDailyQuota} videos/day) reached for your tier`,
        },
      });
      return {
        qualificationStatus: 'DISQUALIFIED',
        rewardEarned: 0,
        message: `You have reached your daily limit (${tierMaxDailyQuota} videos) of rewarded views for today`,
      };
    }

    const todayCampaignQualifiedViews = await prisma.watchSession.count({
      where: {
        userId: session.userId,
        campaignId: session.campaign.id,
        qualificationStatus: 'REWARDED',
        createdAt: { gte: startOfDay },
      },
    });

    if (todayCampaignQualifiedViews >= session.campaign.dailyUserLimit) {
      await prisma.watchSession.update({
        where: { id: session.id },
        data: {
          endedAt: now,
          qualificationStatus: 'DISQUALIFIED',
          disqualificationReason: 'Daily user limit reached for this campaign',
        },
      });
      return {
        qualificationStatus: 'DISQUALIFIED',
        rewardEarned: 0,
        message: `You have reached the daily reward limit (${session.campaign.dailyUserLimit} views) for this campaign`,
      };
    }

    // 5. Server-Determined Reward Calculation & Atomic Execution
    const rewardAmount = session.campaign.rewardPerQualifiedView;

    return prisma.$transaction(async (tx) => {
      // 1. Concurrency-safe campaign budget deduction
      const hasBudget = await CampaignService.deductCampaignBudget(
        session.campaign!.id,
        rewardAmount,
        tx
      );

      if (!hasBudget) {
        await tx.watchSession.update({
          where: { id: session.id },
          data: {
            endedAt: now,
            qualificationStatus: 'DISQUALIFIED',
            disqualificationReason: 'Campaign budget exhausted',
          },
        });
        return {
          qualificationStatus: 'DISQUALIFIED',
          rewardEarned: 0,
          message: 'Campaign budget has been exhausted',
        };
      }

      // 2. Create Reward Record
      const reward = await tx.reward.create({
        data: {
          userId: session.userId,
          sourceType: 'WATCH_REWARD',
          sourceId: session.campaign!.id,
          amount: rewardAmount,
          currency: 'NGN',
          status: 'AVAILABLE',
        },
      });

      // 3. Record Immutable Ledger Entry & Update Wallet
      await LedgerService.recordTransaction(
        {
          userId: session.userId,
          amount: rewardAmount,
          currency: 'NGN',
          direction: 'CREDIT',
          bucket: 'AVAILABLE',
          entryType: 'REWARD_CREDIT',
          referenceType: 'WATCH_SESSION',
          referenceId: session.id,
          rewardId: reward.id,
          description: `Watch reward for video: ${session.video.title.substring(0, 40)}`,
        },
        tx
      );

      // 4. Update session to REWARDED
      await tx.watchSession.update({
        where: { id: session.id },
        data: {
          endedAt: now,
          qualificationStatus: 'REWARDED',
          rewardId: reward.id,
        },
      });

      logger.info(
        `[REWARD ISSUED] User ${session.userId} earned ₦${rewardAmount} for session ${session.id} (Campaign ${session.campaign!.id})`
      );

      return {
        qualificationStatus: 'REWARDED',
        rewardEarned: rewardAmount,
        currency: 'NGN',
        message: `Congratulations! You earned ₦${rewardAmount} for watching this campaign video.`,
      };
    });
  }
}
