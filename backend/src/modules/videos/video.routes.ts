import { Router } from 'express';
import { VideoController } from './video.controller.js';

const router = Router();

router.get('/feed', VideoController.getFeed);
router.get('/:id', VideoController.getVideo);

export default router;
