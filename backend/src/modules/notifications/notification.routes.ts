import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Preferences (Synced on server, never locally on device)
router.get('/preferences', NotificationController.getPreferences);
router.put('/preferences', NotificationController.updatePreferences);

// Device token registration for push notifications
router.post('/device-token', NotificationController.registerDeviceToken);
router.delete('/device-token', NotificationController.removeDeviceToken);

// Notifications list & status
router.get('/', NotificationController.listNotifications);
router.patch('/:id/read', NotificationController.markAsRead);
router.post('/mark-all-read', NotificationController.markAllAsRead);

// Test notification dispatch
router.post('/test-push', NotificationController.testPush);

export default router;
