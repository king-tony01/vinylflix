import { prisma } from '../../prisma/client.js';
import { NotFoundError } from '../../utils/errors.js';

export class VideoService {
  public static async getFeed(query: { limit?: number; offset?: number; search?: string }) {
    const where: any = {
      availabilityStatus: 'PUBLIC',
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        take: query.limit || 20,
        skip: query.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          channel: {
            select: { channelId: true, channelTitle: true, channelThumbnail: true, customUrl: true },
          },
          campaigns: {
            where: { status: 'ACTIVE', remainingBudget: { gt: 0 } },
            select: {
              id: true,
              rewardPerQualifiedView: true,
              minWatchDurationSeconds: true,
              remainingBudget: true,
            },
            take: 1,
          },
        },
      }),
      prisma.video.count({ where }),
    ]);

    // Format feed items with campaign reward badges
    const feed = videos.map((v) => {
      const activeCampaign = v.campaigns[0] || null;
      return {
        id: v.id,
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        description: v.description,
        durationSeconds: v.durationSeconds,
        thumbnailUrl: v.thumbnailUrl,
        publishedAt: v.publishedAt,
        channel: v.channel,
        isRewarded: !!activeCampaign,
        campaign: activeCampaign
          ? {
              campaignId: activeCampaign.id,
              rewardAmount: activeCampaign.rewardPerQualifiedView,
              minWatchSeconds: activeCampaign.minWatchDurationSeconds,
            }
          : null,
      };
    });

    return { feed, total };
  }

  public static async getVideoDetails(videoId: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: true,
        campaigns: {
          where: { status: 'ACTIVE', remainingBudget: { gt: 0 } },
          take: 1,
        },
      },
    });

    if (!video) throw new NotFoundError('Video not found');

    const activeCampaign = video.campaigns[0] || null;

    return {
      id: video.id,
      youtubeVideoId: video.youtubeVideoId,
      title: video.title,
      description: video.description,
      durationSeconds: video.durationSeconds,
      thumbnailUrl: video.thumbnailUrl,
      availabilityStatus: video.availabilityStatus,
      channel: video.channel,
      activeCampaign: activeCampaign
        ? {
            id: activeCampaign.id,
            rewardPerQualifiedView: activeCampaign.rewardPerQualifiedView,
            minWatchDurationSeconds: activeCampaign.minWatchDurationSeconds,
            remainingBudget: activeCampaign.remainingBudget,
          }
        : null,
    };
  }
}
