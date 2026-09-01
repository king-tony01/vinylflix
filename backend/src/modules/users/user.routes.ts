import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.put('/profile', authenticate, UserController.updateProfile);

export default router;
