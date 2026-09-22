import { prisma } from '../../prisma/client.js';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errors.js';
import { AuditService } from '../audit/audit.service.js';
import { createCampaignSchema } from './campaign.dto.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export class CampaignService {
  /**
   * System-calculated parameters formula:
   * - rewardPerQualifiedView: Fixed at ₦5 (distributed to basic and premium viewers per qualified watch)
   * - dailyUserLimit: Fixed at 2 (views per user per day per campaign)
   * - minWatchDurationSeconds:
   *     - if video.durationSeconds < 60 -> 30 seconds (or 80% if shorter)
   *     - if video.durationSeconds >= 60 -> 45 seconds
   * - totalBudget: Included with ₦15,000/mo Creator Tier (ongoing active reward pool: 1,000,000 NGN)
   */
  public static calculateCampaignParameters(videoDurationSeconds: number = 0) {
    const rewardPerQualifiedView = 5;
    const dailyUserLimit = 2;
    let minWatchDurationSeconds = 30;

    if (videoDurationSeconds > 0 && videoDurationSeconds < 60) {
      minWatchDurationSeconds = Math.min(30, Math.max(15, Math.floor(videoDurationSeconds * 0.8)));
    } else if (videoDurationSeconds >= 60) {
      minWatchDurationSeconds = 45;
    }

    // Ongoing active campaign pool included with ₦15,000/mo Creator Membership
    const totalBudget = 1000000;

    return {
      rewardPerQualifiedView,
      minWatchDurationSeconds,
      dailyUserLimit,
      totalBudget,
    };
  }

  public static async createCampaign(
    advertiserId: string,
    data: z.infer<typeof createCampaignSchema>
  ) {
    // 1. Verify creator authorization (CREATOR role or active CREATOR tier membership)
    const user = await prisma.user.findUnique({
      where: { id: advertiserId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
        },
      },
    });

    if (!user) throw new NotFoundError('User not found');

    const hasCreatorAccess =
      user.role === 'CREATOR' ||
      user.role === 'ADVERTISER' ||
      user.role === 'ADMIN' ||
      user.memberships.some((m) => m.plan?.tier === 'CREATOR');

    if (!hasCreatorAccess) {
      throw new ForbiddenError(
        'Campaign creation is reserved exclusively for the Creator / Advertiser Tier (₦15,000/month).'
      );
    }

    const video = await prisma.video.findUnique({
      where: { id: data.videoId },
    });
    if (!video) throw new NotFoundError('Target video not found');

    // 2. Automated Server Calculation of Campaign Parameters
    const calculated = this.calculateCampaignParameters(video.durationSeconds || 0);

    const totalBudget = data.totalBudget ?? calculated.totalBudget;
    const rewardPerQualifiedView = data.rewardPerQualifiedView ?? calculated.rewardPerQualifiedView;
    const minWatchDurationSeconds = data.minWatchDurationSeconds ?? calculated.minWatchDurationSeconds;
    const dailyUserLimit = data.dailyUserLimit ?? calculated.dailyUserLimit;

    const campaign = await prisma.campaign.create({
      data: {
        advertiserId,
        videoId: data.videoId,
        title: data.title,
        description: data.description || null,
        totalBudget,
        spentBudget: 0,
        remainingBudget: totalBudget,
        rewardPerQualifiedView,
        minWatchDurationSeconds,
        dailyUserLimit,
        status: 'ACTIVE',
        targetingJson: data.targeting ? JSON.stringify(data.targeting) : null,
        startsAt: new Date(),
      },
      include: {
        video: true,
      },
    });

    await AuditService.log({
      actorId: advertiserId,
      action: 'CAMPAIGN_CREATED',
      targetType: 'CAMPAIGN',
      targetId: campaign.id,
      newState: {
        budget: totalBudget,
        rewardPerView: rewardPerQualifiedView,
        minWatchDuration: minWatchDurationSeconds,
        dailyLimit: dailyUserLimit,
        videoId: data.videoId,
      },
    });

    return campaign;
  }

  public static async updateCampaignStatus(
    campaignId: string,
    status: string,
    adminId?: string,
    reviewNote?: string
  ) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundError('Campaign not found');

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status,
        approvedById: adminId || null,
        reviewNote: reviewNote || null,
        startsAt: status === 'ACTIVE' && !campaign.startsAt ? new Date() : undefined,
      },
    });

    await AuditService.log({
      actorId: adminId,
      action: `CAMPAIGN_STATUS_${status}`,
      targetType: 'CAMPAIGN',
      targetId: campaignId,
      previousState: { status: campaign.status },
      newState: { status },
      reason: reviewNote,
    });

    return updated;
  }

  /**
   * Concurrency-safe budget deduction for qualifying views.
   */
  public static async deductCampaignBudget(
    campaignId: string,
    rewardAmount: number,
    tx: Prisma.TransactionClient
  ): Promise<boolean> {
    const campaign = await tx.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.status !== 'ACTIVE' || campaign.remainingBudget < rewardAmount) {
      return false;
    }

    const updatedRemaining = campaign.remainingBudget - rewardAmount;
    const isCompleted = updatedRemaining < campaign.rewardPerQualifiedView;

    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        spentBudget: { increment: rewardAmount },
        remainingBudget: { decrement: rewardAmount },
        status: isCompleted ? 'COMPLETED' : undefined,
      },
    });

    return true;
  }

  public static async getAdvertiserCampaigns(advertiserId: string) {
    const campaigns = await prisma.campaign.findMany({
      where: { advertiserId },
      orderBy: { createdAt: 'desc' },
      include: {
        video: true,
        _count: {
          select: {
            watchSessions: { where: { qualificationStatus: 'QUALIFIED' } },
          },
        },
      },
    });

    return campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      status: c.status,
      totalBudget: c.totalBudget,
      spentBudget: c.spentBudget,
      remainingBudget: c.remainingBudget,
      rewardPerQualifiedView: c.rewardPerQualifiedView,
      minWatchDurationSeconds: c.minWatchDurationSeconds,
      dailyUserLimit: c.dailyUserLimit,
      qualifiedViews: c._count.watchSessions,
      video: c.video,
      createdAt: c.createdAt,
    }));
  }

  public static async deleteCampaign(campaignId: string, userId: string, isAdmin: boolean = false) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (!isAdmin && campaign.advertiserId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this campaign');
    }

    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    await AuditService.log({
      actorId: userId,
      action: 'CAMPAIGN_DELETED',
      targetType: 'CAMPAIGN',
      targetId: campaignId,
      previousState: {
        title: campaign.title,
        status: campaign.status,
        totalBudget: campaign.totalBudget,
        spentBudget: campaign.spentBudget,
      },
    });

    return { success: true, message: 'Campaign successfully deleted' };
  }

  public static async cancelCampaign(campaignId: string, userId: string, isAdmin: boolean = false) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (!isAdmin && campaign.advertiserId !== userId) {
      throw new ForbiddenError('You do not have permission to cancel this campaign');
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'CANCELLED',
      },
    });

    await AuditService.log({
      actorId: userId,
      action: 'CAMPAIGN_CANCELLED',
      targetType: 'CAMPAIGN',
      targetId: campaignId,
      previousState: { status: campaign.status },
      newState: { status: 'CANCELLED' },
    });

    return updated;
  }
}
