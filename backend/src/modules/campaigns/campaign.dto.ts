import { z } from 'zod';

export const createCampaignSchema = z.object({
  videoId: z.string().min(1),
  title: z.string().min(3).max(150),
  description: z.string().optional(),
  totalBudget: z.number().positive().optional(),
  rewardPerQualifiedView: z.number().positive().optional(),
  minWatchDurationSeconds: z.number().int().min(15).max(300).optional(),
  dailyUserLimit: z.number().int().positive().optional(),
  targeting: z.record(z.any()).optional(),
});

export const updateCampaignStatusSchema = z.object({
  status: z.enum(['APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED', 'CANCELLED']),
  reviewNote: z.string().optional(),
});
