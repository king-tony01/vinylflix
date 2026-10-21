import { Request, Response, NextFunction } from 'express';
import { MovieService } from './movie.service.js';
import { StreamResolverService } from './stream-resolver.service.js';

export class MovieController {
  public static async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const type = (req.query.type as 'all' | 'movie' | 'tv') || 'all';
      const timeWindow = (req.query.time_window as 'day' | 'week') || 'week';
      const genre = req.query.genre as string | undefined;
      const data = await MovieService.getTrending(type, timeWindow, genre);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getPopular(req: Request, res: Response, next: NextFunction) {
    try {
      const type = (req.query.type as 'movie' | 'tv') || 'movie';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const genre = req.query.genre as string | undefined;
      const data = await MovieService.getPopular(type, page, genre);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const data = await MovieService.search(query, page);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const tmdbId = req.params.tmdbId as string;
      const isSeries = req.query.isSeries === 'true' || req.query.type === 'tv';
      const data = await MovieService.getDetails(tmdbId, isSeries);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getSimilar(req: Request, res: Response, next: NextFunction) {
    try {
      const tmdbId = req.params.tmdbId as string;
      const isSeries = req.query.isSeries === 'true' || req.query.type === 'tv';
      const data = await MovieService.getSimilar(tmdbId, isSeries);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getSeasonEpisodes(req: Request, res: Response, next: NextFunction) {
    try {
      const tmdbId = req.params.tmdbId as string;
      const seasonNumber = parseInt(req.params.seasonNumber as string, 10) || 1;
      const data = await MovieService.getSeasonEpisodes(tmdbId, seasonNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async getStreams(req: Request, res: Response, next: NextFunction) {
    try {
      const tmdbId = req.params.tmdbId as string;
      const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
      const episode = req.query.episode ? parseInt(req.query.episode as string, 10) : undefined;
      const isSeries = req.query.isSeries === 'true' || (season !== undefined && episode !== undefined);

      const protocol = req.protocol;
      const host = req.get('host') || 'localhost:4000';
      const baseUrl = `${protocol}://${host}`;

      const data = await StreamResolverService.resolveBestStreams(tmdbId, season, episode, isSeries, baseUrl);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async proxyStream(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        res.status(400).json({ success: false, error: 'url parameter is required' });
        return;
      }
      const referer = req.query.referer as string | undefined;
      const range = req.headers.range;

      await StreamResolverService.proxyMedia(targetUrl, referer, range, res);
    } catch (error) {
      next(error);
    }
  }
}

