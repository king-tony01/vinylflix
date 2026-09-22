import { Router } from 'express';
import { CampaignController } from './campaign.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { createCampaignSchema, updateCampaignStatusSchema } from './campaign.dto.js';

const router = Router();

router.post('/', authenticate, requireRole('CREATOR', 'ADVERTISER'), validateBody(createCampaignSchema), CampaignController.create);
router.get('/my', authenticate, requireRole('CREATOR', 'ADVERTISER'), CampaignController.getMyCampaigns);
router.delete('/:id', authenticate, requireRole('CREATOR', 'ADVERTISER'), CampaignController.delete);
router.patch('/:id/cancel', authenticate, requireRole('CREATOR', 'ADVERTISER'), CampaignController.cancel);
router.patch('/:id/status', authenticate, requireRole('ADMIN'), validateBody(updateCampaignStatusSchema), CampaignController.updateStatus);

export default router;
