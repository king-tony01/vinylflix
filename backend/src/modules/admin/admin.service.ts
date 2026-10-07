import { prisma } from '../../prisma/client.js';
import { NotFoundError, AppError } from '../../utils/errors.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ConfigService } from '../config/config.service.js';
import { YouTubeService } from '../youtube/youtube.service.js';

export class AdminService {
  public static async getDashboardMetrics() {
    const [
      totalUsers,
      paidMembers,
      totalCampaigns,
      activeCampaigns,
      pendingWithdrawals,
      completedWithdrawals,
      rewardsAgg,
      paymentsAgg,
      riskAlertsCount,
      pendingManualPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.membership.count({ where: { status: 'ACTIVE' } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.withdrawal.count({ where: { status: 'COMPLETED' } }),
      prisma.reward.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['AVAILABLE', 'LOCKED'] } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SETTLED' },
      }),
      prisma.riskEvent.count({
        where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } },
      }),
      prisma.payment.count({
        where: { provider: 'MANUAL_BANK_TRANSFER', status: 'PENDING_REVIEW' },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        paidMembers,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
      },
      financials: {
        totalRevenue: paymentsAgg._sum.amount || 0,
        totalRewardsIssued: rewardsAgg._sum.amount || 0,
        pendingWithdrawalsCount: pendingWithdrawals,
        completedWithdrawalsCount: completedWithdrawals,
        pendingManualPaymentsCount: pendingManualPayments,
      },
      risk: {
        highRiskAlerts: riskAlertsCount,
      },
    };
  }

  public static async listUsers(query: { search?: string; role?: string; status?: string; limit?: number; offset?: number }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { username: { contains: query.search } },
        { referralCode: { contains: query.search } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: query.limit || 30,
        skip: query.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          wallet: true,
          riskScore: true,
          memberships: { where: { status: 'ACTIVE' }, take: 1 },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  public static async updateUserStatus(
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED',
    adminId: string,
    reason: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await AuditService.log({
      actorId: adminId,
      action: `USER_STATUS_${status}`,
      targetType: 'USER',
      targetId: userId,
      previousState: { status: user.status },
      newState: { status },
      reason,
    });

    return updated;
  }

  public static async reverseReward(rewardId: string, adminId: string, reason: string) {
    const updatedReward = await LedgerService.reverseReward(rewardId, adminId, reason);

    await AuditService.log({
      actorId: adminId,
      action: 'REWARD_REVERSED',
      targetType: 'REWARD',
      targetId: rewardId,
      reason,
    });

    return updatedReward;
  }

  public static async listPendingWithdrawals() {
    return prisma.withdrawal.findMany({
      where: { status: 'PENDING_REVIEW' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            riskScore: true,
          },
        },
      },
    });
  }

  public static async updatePlatformConfig(
    key: string,
    value: any,
    adminId: string,
    description?: string
  ) {
    await ConfigService.set(key, value, description, adminId);
    return { key, value };
  }

  public static async listCampaigns(query: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { video: { title: { contains: query.search } } },
        { advertiser: { username: { contains: query.search } } },
        { advertiser: { email: { contains: query.search } } },
      ];
    }

    const [campaigns, total, pendingCount, activeCount] = await Promise.all([
      prisma.campaign.findMany({
        where,
        take: query.limit || 50,
        skip: query.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          advertiser: {
            select: { id: true, username: true, email: true, role: true },
          },
          video: {
            include: {
              channel: {
                select: { channelTitle: true, channelThumbnail: true, customUrl: true },
              },
            },
          },
          _count: {
            select: {
              watchSessions: { where: { qualificationStatus: 'QUALIFIED' } },
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
      prisma.campaign.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      campaigns: campaigns.map((c) => ({
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
        reviewNote: c.reviewNote,
        approvedById: c.approvedById,
        startsAt: c.startsAt,
        createdAt: c.createdAt,
        qualifiedViews: c._count.watchSessions,
        advertiser: c.advertiser,
        video: c.video,
      })),
      total,
      stats: {
        pendingCount,
        activeCount,
      },
    };
  }

  public static async reviewCampaign(params: {
    campaignId: string;
    adminId: string;
    action: 'APPROVE' | 'REJECT' | 'PAUSE' | 'RESUME';
    reviewNote?: string;
  }) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.campaignId },
      include: { video: true, advertiser: true },
    });
    if (!campaign) throw new NotFoundError('Campaign not found');

    let newStatus = 'ACTIVE';
    if (params.action === 'APPROVE' || params.action === 'RESUME') {
      newStatus = 'ACTIVE';
    } else if (params.action === 'REJECT') {
      newStatus = 'REJECTED';
    } else if (params.action === 'PAUSE') {
      newStatus = 'PAUSED';
    }

    const updated = await prisma.campaign.update({
      where: { id: params.campaignId },
      data: {
        status: newStatus,
        approvedById: params.adminId,
        reviewNote: params.reviewNote || null,
        startsAt: newStatus === 'ACTIVE' && !campaign.startsAt ? new Date() : undefined,
      },
    });

    await AuditService.log({
      actorId: params.adminId,
      action: `CAMPAIGN_${params.action}`,
      targetType: 'CAMPAIGN',
      targetId: params.campaignId,
      previousState: { status: campaign.status },
      newState: { status: newStatus, reviewNote: params.reviewNote },
      reason: params.reviewNote || `Admin ${params.action} campaign`,
    });

    return updated;
  }

  public static async listVideos(query: {
    type?: string;
    availabilityStatus?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const andConditions: any[] = [];

    if (query.availabilityStatus && query.availabilityStatus !== 'ALL') {
      andConditions.push({ availabilityStatus: query.availabilityStatus });
    }

    if (query.type === 'CURATED' || query.type === 'ENTERTAINMENT') {
      andConditions.push({ campaigns: { none: {} } });
    } else if (query.type === 'CAMPAIGN' || query.type === 'REWARDED') {
      andConditions.push({ campaigns: { some: {} } });
    }

    if (query.search) {
      andConditions.push({
        OR: [
          { title: { contains: query.search } },
          { description: { contains: query.search } },
          { youtubeVideoId: { contains: query.search } },
          { channel: { channelTitle: { contains: query.search } } },
        ],
      });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const [videos, total, totalCurated, totalCampaigns, totalViews] = await Promise.all([
      prisma.video.findMany({
        where,
        take: query.limit || 50,
        skip: query.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          channel: {
            select: { channelTitle: true, channelThumbnail: true, customUrl: true },
          },
          campaigns: {
            select: {
              id: true,
              title: true,
              status: true,
              rewardPerQualifiedView: true,
              totalBudget: true,
              remainingBudget: true,
            },
          },
          _count: {
            select: {
              watchSessions: true,
            },
          },
        },
      }),
      prisma.video.count({ where }),
      prisma.video.count({ where: { campaigns: { none: {} } } }),
      prisma.video.count({ where: { campaigns: { some: {} } } }),
      prisma.watchSession.count(),
    ]);

    return {
      videos: videos.map((v) => ({
        id: v.id,
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        description: v.description,
        durationSeconds: v.durationSeconds,
        thumbnailUrl: v.thumbnailUrl,
        availabilityStatus: v.availabilityStatus,
        createdAt: v.createdAt,
        channel: v.channel,
        campaigns: v.campaigns,
        isCurated: v.campaigns.length === 0,
        watchCount: v._count.watchSessions,
      })),
      total,
      stats: {
        totalVideos: totalCurated + totalCampaigns,
        curatedCount: totalCurated,
        campaignCount: totalCampaigns,
        totalViews,
      },
    };
  }

  public static async previewVideo(videoUrlOrId: string) {
    return YouTubeService.fetchVideoDetails(videoUrlOrId);
  }

  public static async addCuratedVideo(
    adminId: string,
    data: {
      videoUrlOrId: string;
      title?: string;
      description?: string;
      durationSeconds?: number;
      thumbnailUrl?: string;
      channelTitle?: string;
      availabilityStatus?: string;
    }
  ) {
    const details = await YouTubeService.fetchVideoDetails(data.videoUrlOrId);

    // Find or create platform/admin channel identity
    let channel = await prisma.youTubeConnection.findFirst({
      where: { userId: adminId },
    });

    if (!channel) {
      channel = await prisma.youTubeConnection.create({
        data: {
          userId: adminId,
          channelId: details.channelId || `UC_${details.youtubeVideoId}_${Date.now()}`,
          channelTitle: data.channelTitle || details.channelTitle || 'Vinylflix Curated',
          channelThumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
          customUrl: `@${(data.channelTitle || details.channelTitle || 'vinylflix').toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
          accessTokenEncrypted: 'admin_curated_connection',
          isConnected: true,
          syncedAt: new Date(),
        },
      });
    }

    const title = data.title?.trim() || details.title;
    const description = data.description !== undefined ? data.description : details.description;
    const durationSeconds =
      data.durationSeconds && data.durationSeconds > 0 ? data.durationSeconds : details.durationSeconds || 180;
    const thumbnailUrl = data.thumbnailUrl || details.thumbnailUrl;
    const availabilityStatus = data.availabilityStatus || details.availabilityStatus || 'PUBLIC';

    const video = await prisma.video.upsert({
      where: { youtubeVideoId: details.youtubeVideoId },
      create: {
        youtubeVideoId: details.youtubeVideoId,
        channelId: channel.id,
        title,
        description,
        durationSeconds,
        thumbnailUrl,
        availabilityStatus,
        lastCheckedAt: new Date(),
      },
      update: {
        title,
        description,
        durationSeconds,
        thumbnailUrl,
        availabilityStatus,
        lastCheckedAt: new Date(),
      },
      include: {
        channel: true,
        campaigns: true,
      },
    });

    await AuditService.log({
      actorId: adminId,
      action: 'VIDEO_CURATED_ADDED',
      targetType: 'VIDEO',
      targetId: video.id,
      newState: {
        youtubeVideoId: video.youtubeVideoId,
        title: video.title,
        availabilityStatus: video.availabilityStatus,
      },
      reason: 'Admin added curated entertainment video to platform',
    });

    return video;
  }

  public static async updateVideo(
    videoId: string,
    adminId: string,
    data: {
      title?: string;
      description?: string;
      availabilityStatus?: string;
      durationSeconds?: number;
    }
  ) {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundError('Video not found');

    const updated = await prisma.video.update({
      where: { id: videoId },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        description: data.description !== undefined ? data.description : undefined,
        availabilityStatus: data.availabilityStatus || undefined,
        durationSeconds: data.durationSeconds || undefined,
      },
    });

    await AuditService.log({
      actorId: adminId,
      action: 'VIDEO_UPDATED',
      targetType: 'VIDEO',
      targetId: videoId,
      previousState: {
        title: video.title,
        availabilityStatus: video.availabilityStatus,
      },
      newState: {
        title: updated.title,
        availabilityStatus: updated.availabilityStatus,
      },
      reason: 'Admin updated video metadata or visibility',
    });

    return updated;
  }

  public static async deleteVideo(videoId: string, adminId: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        campaigns: true,
        watchSessions: { take: 1 },
      },
    });
    if (!video) throw new NotFoundError('Video not found');

    // If campaigns or watch sessions exist, mark as UNAVAILABLE instead of hard deleting to preserve ledger and campaign integrity
    if (video.campaigns.length > 0 || video.watchSessions.length > 0) {
      await prisma.video.update({
        where: { id: videoId },
        data: { availabilityStatus: 'UNAVAILABLE' },
      });
    } else {
      await prisma.video.delete({ where: { id: videoId } });
    }

    await AuditService.log({
      actorId: adminId,
      action: 'VIDEO_DELETED',
      targetType: 'VIDEO',
      targetId: videoId,
      previousState: { title: video.title, youtubeVideoId: video.youtubeVideoId },
      reason: 'Admin removed video from platform',
    });

    return { success: true, message: 'Video removed from platform.' };
  }
}
