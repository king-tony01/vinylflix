import { prisma } from '../../prisma/client.js';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errors.js';
import { AuditService } from '../audit/audit.service.js';
import { createCampaignSchema } from './campaign.dto.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export class CampaignService {
  public static async createCampaign(
    advertiserId: string,
    data: z.infer<typeof createCampaignSchema>
  ) {
    const video = await prisma.video.findUnique({
      where: { id: data.videoId },
    });
    if (!video) throw new NotFoundError('Target video not found');

    const campaign = await prisma.campaign.create({
      data: {
        advertiserId,
        videoId: data.videoId,
        title: data.title,
        description: data.description || null,
        totalBudget: data.totalBudget,
        spentBudget: 0,
        remainingBudget: data.totalBudget,
        rewardPerQualifiedView: data.rewardPerQualifiedView,
        minWatchDurationSeconds: data.minWatchDurationSeconds,
        dailyUserLimit: data.dailyUserLimit,
        status: 'PENDING_REVIEW',
        targetingJson: data.targeting ? JSON.stringify(data.targeting) : null,
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
      newState: { budget: data.totalBudget, videoId: data.videoId },
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
      qualifiedViews: c._count.watchSessions,
      video: c.video,
      createdAt: c.createdAt,
    }));
  }
}
