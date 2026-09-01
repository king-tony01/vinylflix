import { Request, Response, NextFunction } from 'express';
import { YouTubeService } from './youtube.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { config } from '../../config/index.js';

export class YouTubeController {
  public static async getAuthUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const state = req.user ? `user_${req.user.userId}` : undefined;
      const url = YouTubeService.getAuthUrl(state);
      res.json({ success: true, data: { url }, url });
    } catch (error) {
      next(error);
    }
  }

  public static async handleOAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;

      if (!code) {
        return res.redirect(`${config.appUrl}/campaigns?error=missing_code`);
      }

      const userId = state?.startsWith('user_') ? state.replace('user_', '') : undefined;
      if (!userId) {
        return res.redirect(`${config.appUrl}/campaigns?error=missing_user_state`);
      }

      // 1. Exchange code for Google tokens
      const tokenData = await YouTubeService.exchangeCodeForTokens(code);

      // 2. Fetch real channel profile from Google
      const channel = await YouTubeService.fetchUserChannel(tokenData.accessToken);

      // 3. Connect channel to user
      const connection = await YouTubeService.connectChannel(userId, {
        channelId: channel.channelId,
        channelTitle: channel.channelTitle,
        channelThumbnail: channel.channelThumbnail,
        customUrl: channel.customUrl,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
      });

      // 4. Sync videos
      await YouTubeService.syncChannelVideos(connection.id);

      return res.redirect(`${config.appUrl}/campaigns?connected=true&channel=${encodeURIComponent(channel.channelTitle)}`);
    } catch (error: any) {
      return res.redirect(`${config.appUrl}/campaigns?error=${encodeURIComponent(error.message || 'OAuth failure')}`);
    }
  }

  public static async importVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { videoUrl } = req.body;
      const video = await YouTubeService.importVideo(req.user!.userId, videoUrl);
      res.status(201).json({ success: true, data: video });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyVideoUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { videoUrl } = req.body;
      const details = await YouTubeService.fetchVideoDetails(videoUrl);
      res.json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  }

  public static async connectDemoChannel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { channelId, channelTitle, channelThumbnail, customUrl } = req.body;
      const connection = await YouTubeService.connectChannel(req.user!.userId, {
        channelId: channelId || `UC_${Math.random().toString(36).substring(2, 10)}`,
        channelTitle: channelTitle || `${req.user!.userId.slice(0, 6)} Creator Channel`,
        channelThumbnail: channelThumbnail || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        customUrl: customUrl || `@${(channelTitle || 'creator').toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
        subscriberCount: 25000,
        videoCount: 15,
        accessToken: 'mock_access_token_demo',
      });

      const videos = await YouTubeService.syncChannelVideos(connection.id);
      res.status(201).json({ success: true, data: { connection, videos } });
    } catch (error) {
      next(error);
    }
  }

  public static async syncVideos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const connectionId = req.params.connectionId as string;
      const videos = await YouTubeService.syncChannelVideos(connectionId);
      res.json({ success: true, data: videos });
    } catch (error) {
      next(error);
    }
  }
}
