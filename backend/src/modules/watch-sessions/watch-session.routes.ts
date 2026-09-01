import { Router } from 'express';
import { WatchSessionController } from './watch-session.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  startSessionSchema,
  heartbeatSchema,
  completeSessionSchema,
} from './watch-session.dto.js';

const router = Router();

router.post('/start', authenticate, validateBody(startSessionSchema), WatchSessionController.start);
router.post('/heartbeat', authenticate, validateBody(heartbeatSchema), WatchSessionController.heartbeat);
router.post('/complete', authenticate, validateBody(completeSessionSchema), WatchSessionController.complete);

export default router;
