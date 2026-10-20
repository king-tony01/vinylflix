import { Router } from 'express';
import { MovieController } from './movie.controller.js';

const router = Router();

// Public routes for catalog discovery & playback
router.get('/trending', MovieController.getTrending);
router.get('/popular', MovieController.getPopular);
router.get('/search', MovieController.search);
router.get('/stream-proxy', MovieController.proxyStream);
router.get('/:tmdbId/streams', MovieController.getStreams);
router.get('/:tmdbId/similar', MovieController.getSimilar);
router.get('/:tmdbId/season/:seasonNumber', MovieController.getSeasonEpisodes);
router.get('/:tmdbId', MovieController.getDetails);

export default router;
