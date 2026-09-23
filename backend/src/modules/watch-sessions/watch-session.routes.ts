import { Router } from 'express';
import { WatchSessionController } from './watch-session.controller.js';
import { authenticate, requireVerifiedEmail } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  startSessionSchema,
  heartbeatSchema,
  completeSessionSchema,
} from './watch-session.dto.js';

const router = Router();

router.use(authenticate, requireVerifiedEmail);

router.post('/start', validateBody(startSessionSchema), WatchSessionController.start);
router.post('/heartbeat', validateBody(heartbeatSchema), WatchSessionController.heartbeat);
router.post('/complete', validateBody(completeSessionSchema), WatchSessionController.complete);
router.get('/daily-stats', WatchSessionController.getDailyStats);

export default router;
