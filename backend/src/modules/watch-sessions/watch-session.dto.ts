import { z } from 'zod';

export const startSessionSchema = z.object({
  videoId: z.string().min(1),
  campaignId: z.string().optional(),
  deviceFingerprint: z.string().optional(),
});

export const heartbeatSchema = z.object({
  sessionToken: z.string().min(1),
  currentPositionSeconds: z.number().nonnegative(),
  playbackState: z.enum(['PLAYING', 'PAUSED', 'BUFFERING']),
});

export const completeSessionSchema = z.object({
  sessionToken: z.string().min(1),
  finalPositionSeconds: z.number().nonnegative(),
});
