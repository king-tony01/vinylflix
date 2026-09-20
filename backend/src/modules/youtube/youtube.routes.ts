import { Router } from 'express';
import { YouTubeController } from './youtube.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/oauth/url', authenticate, YouTubeController.getAuthUrl);
router.get('/oauth/callback', YouTubeController.handleOAuthCallback);
router.get('/channel', authenticate, YouTubeController.getConnectedChannel);
router.delete('/channel', authenticate, YouTubeController.disconnectChannel);
router.post('/verify-url', YouTubeController.verifyVideoUrl);
router.post('/import-video', authenticate, YouTubeController.importVideo);
router.post('/connect-demo', authenticate, YouTubeController.connectDemoChannel);
router.post('/sync/:connectionId', authenticate, YouTubeController.syncVideos);

export default router;
