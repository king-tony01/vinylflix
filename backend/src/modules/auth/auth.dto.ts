import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6),
  phone: z.string().optional(),
  fullName: z.string().optional(),
  referralCode: z.string().optional(),
});

export const loginSchema = z
  .object({
    login: z.string().min(1).optional(),
    email: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1),
  })
  .refine((data) => !!(data.login || data.email || data.username), {
    message: 'Email or username is required',
    path: ['login'],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});
