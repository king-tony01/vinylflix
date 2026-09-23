import { Router } from 'express';
import { YouTubeController } from './youtube.controller.js';
import { authenticate, requireVerifiedEmail } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/oauth/url', authenticate, requireVerifiedEmail, YouTubeController.getAuthUrl);
router.get('/oauth/callback', YouTubeController.handleOAuthCallback);
router.get('/channel', authenticate, requireVerifiedEmail, YouTubeController.getConnectedChannel);
router.delete('/channel', authenticate, requireVerifiedEmail, YouTubeController.disconnectChannel);
router.post('/verify-url', YouTubeController.verifyVideoUrl);
router.post('/import-video', authenticate, requireVerifiedEmail, YouTubeController.importVideo);
router.post('/connect-demo', authenticate, requireVerifiedEmail, YouTubeController.connectDemoChannel);
router.post('/sync/:connectionId', authenticate, requireVerifiedEmail, YouTubeController.syncVideos);

export default router;
