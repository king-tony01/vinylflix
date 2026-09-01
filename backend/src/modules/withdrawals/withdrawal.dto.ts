import { z } from 'zod';

export const requestWithdrawalSchema = z.object({
  amount: z.number().positive(),
  accountDetails: z.object({
    bankName: z.string().min(2),
    accountNumber: z.string().min(10).max(10),
    accountName: z.string().min(2),
  }),
  idempotencyKey: z.string().optional(),
});

export const processWithdrawalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reviewNote: z.string().optional(),
});
