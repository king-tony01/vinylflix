import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema, verifyEmailSchema, resendVerificationSchema } from './auth.dto.js';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/verify-email', validateBody(verifyEmailSchema), AuthController.verifyEmail);
router.post('/resend-verification', validateBody(resendVerificationSchema), AuthController.resendVerification);
router.post('/refresh-token', validateBody(refreshTokenSchema), AuthController.refreshToken);
router.get('/me', authenticate, AuthController.getMe);

export default router;

