import { z } from 'zod';

export const createCampaignSchema = z.object({
  videoId: z.string().min(1),
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  totalBudget: z.number().positive(),
  rewardPerQualifiedView: z.number().positive().default(5),
  minWatchDurationSeconds: z.number().int().min(15).max(300).default(30),
  dailyUserLimit: z.number().int().positive().default(20),
  targeting: z.record(z.any()).optional(),
});

export const updateCampaignStatusSchema = z.object({
  status: z.enum(['APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED', 'CANCELLED']),
  reviewNote: z.string().optional(),
});
