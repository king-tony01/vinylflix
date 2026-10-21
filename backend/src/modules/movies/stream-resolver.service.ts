import { Response } from 'express';

export interface ResolvedStream {
  url: string;
  quality: string;
  serverName: string;
  playerType: 'direct' | 'embed';
  headers?: Record<string, string>;
  isDirectHls?: boolean;
}

export class StreamResolverService {
  private static userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  /**
   * Resolves and ranks streaming sources for a given movie or episode.
   * Prioritizes direct HLS/MP4 streams (clean, ad-free, native ExoPlayer).
   */
  public static async resolveBestStreams(
    tmdbId: string,
    season?: number,
    episode?: number,
    isSeries = false,
    baseUrl = ''
  ): Promise<ResolvedStream[]> {
    const isTv = isSeries || (season !== undefined && episode !== undefined);
    const s = season ?? 1;
    const ep = episode ?? 1;

    const streams: ResolvedStream[] = [];

    // 1. Direct high-speed stream resolution (pure native ExoPlayer, zero ads)
    try {
      const encRes: any = await fetch(
        `https://enc-dec.app/api/enc-vidlink?text=${encodeURIComponent(tmdbId)}`,
        { signal: AbortSignal.timeout(6000) }
      ).then((r) => r.json());

      if (encRes && encRes.status === 200 && encRes.result) {
        const encrypted = encRes.result;
        const subPath = isTv ? `tv/${encrypted}/${s}/${ep}` : `movie/${encrypted}`;

        const vidRes: any = await fetch(`https://vidlink.pro/api/b/${subPath}`, {
          headers: {
            'User-Agent': this.userAgent,
            Origin: 'https://vidlink.pro',
            Referer: 'https://vidlink.pro/',
          },
          signal: AbortSignal.timeout(8000),
        }).then((r) => r.json());

        if (vidRes && vidRes.stream && vidRes.stream.qualities) {
          const qualities = vidRes.stream.qualities;
          const order = ['1080', '720', '480', '360'];
          for (const q of order) {
            if (qualities[q] && qualities[q].url) {
              const label = q === '1080' ? '1080p Full HD' : `${q}p`;
              streams.push({
                serverName: `Server ${streams.length + 1} (${label})`,
                quality: label,
                url: qualities[q].url,
                playerType: 'direct',
                isDirectHls: false,
                headers: {}, // Do NOT send filmboom referer: prevents 429 hotlink block on hakunaymatata
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`[StreamResolver] Vidlink extraction notice: ${err.message}`);
    }

    // 2. Fallback direct HLS extraction via Videasy if Vidlink returned no direct streams
    if (streams.length === 0) {
      try {
        const seedRes: any = await fetch(
          `https://api.wecollege.net/seed?mediaId=${encodeURIComponent(tmdbId)}`,
          {
            headers: { 'User-Agent': this.userAgent, Referer: 'https://player.videasy.to/' },
            signal: AbortSignal.timeout(5000),
          }
        ).then((r) => r.json());

        if (seedRes && seedRes.seed) {
          const seed = seedRes.seed;
          const mediaType = isTv ? 'tv' : 'movie';
          let url = `https://api.wecollege.net/miami/sources?mediaType=${mediaType}&tmdbId=${tmdbId}&enc=2&seed=${seed}`;
          if (isTv) {
            url += `&seasonId=${s}&episodeId=${ep}`;
          }

          const encData = await fetch(url, {
            headers: {
              'User-Agent': this.userAgent,
              Origin: 'https://player.videasy.to',
              Referer: 'https://player.videasy.to/',
            },
            signal: AbortSignal.timeout(7000),
          }).then((r) => r.text());

          if (encData && encData.length > 50) {
            const decRes: any = await fetch('https://enc-dec.app/api/dec-videasy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: encData, id: String(tmdbId), seed }),
              signal: AbortSignal.timeout(6000),
            }).then((r) => r.json());

            if (decRes && decRes.status === 200 && decRes.result) {
              const res = decRes.result;
              if (Array.isArray(res.sources) && res.sources.length > 0) {
                for (const src of res.sources) {
                  streams.push({
                    serverName: `Server ${streams.length + 1} (${src.quality})`,
                    quality: src.quality,
                    url: src.url,
                    playerType: 'direct',
                    isDirectHls: true,
                    headers: {
                      'User-Agent': this.userAgent,
                      Referer: 'https://player.videasy.to/',
                      Origin: 'https://player.videasy.to',
                    },
                  });
                }
              } else if (res.playlist) {
                streams.push({
                  serverName: `Server ${streams.length + 1} (Adaptive HD)`,
                  quality: 'Adaptive HD',
                  url: res.playlist,
                  playerType: 'direct',
                  isDirectHls: true,
                  headers: {
                    'User-Agent': this.userAgent,
                    Referer: 'https://player.videasy.to/',
                    Origin: 'https://player.videasy.to',
                  },
                });
              }
            }
          }
        }
      } catch (err: any) {
        console.warn(`[StreamResolver] Videasy extraction notice: ${err.message}`);
      }
    }

    // 3. Fallback verified multi-mirror embed sources (VidLink, VidSrc.pm, VidSrc.to, 2embed)
    const directSources: Array<{
      name: string;
      quality: string;
      url: string;
      referer?: string;
    }> = [
      {
        name: `Server ${streams.length + 1} (Mirror Auto)`,
        quality: '1080p Mirror',
        url: isTv
          ? `https://vidlink.pro/tv/${tmdbId}/${s}/${ep}?autoplay=true`
          : `https://vidlink.pro/movie/${tmdbId}?autoplay=true`,
        referer: 'https://vidlink.pro/',
      },
      {
        name: `Server ${streams.length + 2} (Mirror HD)`,
        quality: '1080p HD',
        url: isTv
          ? `https://vidsrc.pm/embed/tv/${tmdbId}/${s}/${ep}`
          : `https://vidsrc.pm/embed/movie/${tmdbId}`,
        referer: 'https://vidsrc.pm/',
      },
      {
        name: `Server ${streams.length + 3} (Mirror Backup)`,
        quality: '1080p Backup',
        url: isTv
          ? `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${ep}`
          : `https://vidsrc.to/embed/movie/${tmdbId}`,
        referer: 'https://vidsrc.to/',
      },
      {
        name: `Server ${streams.length + 4} (Adaptive Backup)`,
        quality: 'Adaptive Backup',
        url: isTv
          ? `https://2embed.skin/embedtv/${tmdbId}&s=${s}&e=${ep}`
          : `https://2embed.skin/embed/${tmdbId}`,
        referer: 'https://2embed.skin/',
      },
    ];

    for (const src of directSources) {
      streams.push({
        serverName: src.name,
        quality: src.quality,
        url: src.url,
        playerType: 'embed',
        headers: {
          'User-Agent': this.userAgent,
          ...(src.referer ? { Referer: src.referer } : {}),
        },
      });
    }

    return streams;
  }

  /**
   * Proxies HLS and media chunks to bypass CORS, hotlink protection (403),
   * and strips ad segments from m3u8 playlists.
   */
  public static async proxyMedia(
    targetUrl: string,
    referer: string | undefined,
    range: string | undefined,
    res: Response
  ): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'User-Agent': this.userAgent,
        Accept: '*/*',
        ...(referer ? { Referer: referer, Origin: new URL(referer).origin } : {}),
        ...(range ? { Range: range } : {}),
      };

      const upstream = await fetch(targetUrl, {
        headers,
        signal: AbortSignal.timeout(15000),
      });

      if (!upstream.ok && upstream.status !== 206) {
        res.status(upstream.status).send(`Upstream failed: ${upstream.statusText}`);
        return;
      }

      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
      const isM3u8 =
        targetUrl.includes('.m3u8') ||
        contentType.includes('mpegurl') ||
        contentType.includes('x-mpegURL');

      // Forward caching and range headers
      if (upstream.headers.has('content-length')) {
        res.setHeader('Content-Length', upstream.headers.get('content-length')!);
      }
      if (upstream.headers.has('content-range')) {
        res.setHeader('Content-Range', upstream.headers.get('content-range')!);
      }
      if (upstream.headers.has('accept-ranges')) {
        res.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges')!);
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', contentType);
      res.status(upstream.status);

      if (isM3u8) {
        // Parse and rewrite m3u8 playlist to route nested segments through proxy
        let body = await upstream.text();
        const baseUri = new URL(targetUrl);

        // Strip known advertisement discontinuities if present
        body = body.replace(/#EXT-X-DISCONTINUITY[\r\n]+#EXTINF:[^,\r\n]*,[^\r\n]*[\r\n]+https?:\/\/[^\r\n]*ad[^\r\n]*/gi, '');

        // Rewrite relative URLs to absolute proxy URLs
        const lines = body.split('\n');
        const rewritten = lines.map((line) => {
          const trimmed = line.trim();
          if (trimmed.length === 0 || trimmed.startsWith('#')) {
            return line;
          }
          try {
            const absolute = new URL(trimmed, baseUri.href).href;
            return `/api/v1/movies/stream-proxy?url=${encodeURIComponent(absolute)}&referer=${encodeURIComponent(referer || baseUri.origin)}`;
          } catch {
            return line;
          }
        });

        res.send(rewritten.join('\n'));
      } else {
        // Stream binary video chunks (MP4/TS) directly
        if (upstream.body) {
          const reader = upstream.body.getReader();
          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          };
          await pump();
        } else {
          const buffer = await upstream.arrayBuffer();
          res.send(Buffer.from(buffer));
        }
      }
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(502).json({ success: false, error: 'Proxy resolution error', details: err.message });
      }
    }
  }
}
