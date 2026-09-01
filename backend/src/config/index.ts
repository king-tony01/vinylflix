import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  appName: string;
  port: number;
  nodeEnv: string;
  appUrl: string;
  apiBaseUrl: string;
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  youtube: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    apiKey: string;
  };
  payment: {
    provider: string; // 'PAYSTACK' | 'FLUTTERWAVE' | 'MOCK'
    secretKey: string;
    publicKey: string;
    webhookSecret: string;
  };
  paystack: {
    secretKey: string;
    publicKey: string;
  };
  businessDefaults: {
    currency: string;
    membershipPrice: number;
    conditionalReward: number;
    referralRequirement: number;
    minWithdrawalAmount: number;
    minWatchDurationSeconds: number;
    watchRewardAmount: number;
  };
}

export const config: AppConfig = {
  appName: process.env.APP_NAME || 'Vinylflix',
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000/api/v1',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_jwt_key_min_32_chars_fallback!',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_secret_refresh_jwt_key_min_32_chars!',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:4000/api/v1/youtube/oauth/callback',
    apiKey: process.env.YOUTUBE_API_KEY || '',
  },
  payment: {
    provider: (process.env.PAYMENT_PROVIDER || 'PAYSTACK').toUpperCase(),
    secretKey: process.env.PAYSTACK_SECRET_KEY || process.env.PAYMENT_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || process.env.PAYMENT_PUBLIC_KEY || '',
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || '',
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || process.env.PAYMENT_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || process.env.PAYMENT_PUBLIC_KEY || '',
  },
  businessDefaults: {
    currency: process.env.DEFAULT_CURRENCY || 'NGN',
    membershipPrice: parseFloat(process.env.DEFAULT_MEMBERSHIP_PRICE || '3000'),
    conditionalReward: parseFloat(process.env.DEFAULT_CONDITIONAL_REWARD || '10000'),
    referralRequirement: parseInt(process.env.DEFAULT_REFERRAL_REQUIREMENT || '10', 10),
    minWithdrawalAmount: parseFloat(process.env.DEFAULT_MIN_WITHDRAWAL_AMOUNT || '2000'),
    minWatchDurationSeconds: parseInt(process.env.DEFAULT_MIN_WATCH_DURATION || '30', 10),
    watchRewardAmount: parseFloat(process.env.DEFAULT_WATCH_REWARD_AMOUNT || '5'),
  },
};
