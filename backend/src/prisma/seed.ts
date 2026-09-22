import { prisma } from './client.js';
import { hashPassword } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

async function main() {
  logger.info('🧹 Purging all demo data & setting up clean production slate...');

  // 1. Delete all demo transactions, sessions, rewards, campaigns & videos
  await prisma.watchSession.deleteMany({});
  await prisma.reward.deleteMany({});
  await prisma.referral.deleteMany({});
  await prisma.withdrawal.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.paymentWebhookLog.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.video.deleteMany({});
  await prisma.youTubeConnection.deleteMany({});
  await prisma.riskEvent.deleteMany({});
  await prisma.riskScore.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.membership.deleteMany({});

  // 2. Delete all non-admin users & their wallets
  const nonAdminUsers = await prisma.user.findMany({
    where: {
      role: { notIn: ['ADMIN', 'FINANCE_RISK_ADMIN'] },
    },
    select: { id: true },
  });

  const nonAdminIds = nonAdminUsers.map((u) => u.id);

  if (nonAdminIds.length > 0) {
    await prisma.ledgerEntry.deleteMany({ where: { userId: { in: nonAdminIds } } });
    await prisma.profile.deleteMany({ where: { userId: { in: nonAdminIds } } });
    await prisma.wallet.deleteMany({ where: { userId: { in: nonAdminIds } } });
    await prisma.user.deleteMany({ where: { id: { in: nonAdminIds } } });
    logger.info(`✓ Purged ${nonAdminIds.length} demo/test users and associated records.`);
  }

  // 3. Purge non-canonical plans
  const canonicalTiers = ['FREE_STARTER', 'BASIC', 'PREMIUM', 'CREATOR'];
  await prisma.membershipPlan.deleteMany({
    where: {
      tier: { notIn: canonicalTiers },
    },
  });

  // 4. Seed Platform Business Rules & Config
  const configs = [
    { key: 'DEFAULT_CURRENCY', value: 'NGN', description: 'Platform primary currency' },
    { key: 'DEFAULT_MEMBERSHIP_PRICE', value: 3000, description: 'Basic membership price' },
    { key: 'DEFAULT_CONDITIONAL_REWARD', value: 10000, description: 'Basic conditional reward amount' },
    { key: 'DEFAULT_REFERRAL_REQUIREMENT', value: 10, description: 'Referrals required to unlock conditional reward' },
    { key: 'DEFAULT_MIN_WITHDRAWAL_AMOUNT', value: 2000, description: 'Minimum withdrawable balance' },
    { key: 'DEFAULT_MIN_WATCH_DURATION', value: 30, description: 'Minimum watch duration in seconds' },
    { key: 'DEFAULT_WATCH_REWARD_AMOUNT', value: 5, description: 'Reward amount per qualified view' },
    { key: 'PLATFORM_FEE_PERCENT', value: 5.0, description: 'Platform withdrawal processing fee percentage' },
  ];

  for (const c of configs) {
    await prisma.platformConfig.upsert({
      where: { key: c.key },
      create: {
        key: c.key,
        valueJson: JSON.stringify(c.value),
        description: c.description,
      },
      update: {
        valueJson: JSON.stringify(c.value),
        description: c.description,
      },
    });
  }

  // 5. Seed Standard Membership Plans
  const plans = [
    {
      name: 'Free Starter',
      tier: 'FREE_STARTER',
      price: 0,
      currency: 'NGN',
      durationDays: 365,
      benefits: ['Standard video feed access', 'Public content viewing', 'Explore creator campaigns'],
      conditionalRewardAmount: 0,
      referralRequirementCount: 0,
    },
    {
      name: 'Basic Member',
      tier: 'BASIC',
      price: 3000,
      currency: 'NGN',
      durationDays: 30,
      benefits: [
        'Earn cash rewards on campaign videos',
        '₦10,000 conditional milestone reward credit',
        'Referral bonuses & network tracking',
        'Direct bank payouts',
      ],
      conditionalRewardAmount: 10000,
      referralRequirementCount: 10,
    },
    {
      name: 'Premium Member',
      tier: 'PREMIUM',
      price: 7500,
      currency: 'NGN',
      durationDays: 30,
      benefits: [
        'Higher daily reward view limits',
        '₦25,000 conditional milestone reward credit',
        'Priority payout processing',
        'Exclusive high-yield video campaigns',
      ],
      conditionalRewardAmount: 25000,
      referralRequirementCount: 10,
    },
    {
      name: 'Creator / Advertiser Tier',
      tier: 'CREATOR',
      price: 15000,
      currency: 'NGN',
      durationDays: 30,
      benefits: [
        'Connect official YouTube channels',
        'Create targeted video promotion campaigns',
        'Comprehensive viewer analytics',
        'Monetization & audience growth tools',
      ],
      conditionalRewardAmount: 0,
      referralRequirementCount: 0,
    },
  ];

  for (const p of plans) {
    await prisma.membershipPlan.upsert({
      where: { tier: p.tier },
      create: {
        name: p.name,
        tier: p.tier,
        price: p.price,
        currency: p.currency,
        durationDays: p.durationDays,
        benefitsJson: JSON.stringify(p.benefits),
        conditionalRewardAmount: p.conditionalRewardAmount,
        referralRequirementCount: p.referralRequirementCount,
        isActive: true,
      },
      update: {
        name: p.name,
        price: p.price,
        benefitsJson: JSON.stringify(p.benefits),
        conditionalRewardAmount: p.conditionalRewardAmount,
        referralRequirementCount: p.referralRequirementCount,
        isActive: true,
      },
    });
  }

  // 6. Seed Sole Super Administrator Account
  const adminPasswordHash = await hashPassword('AdminPassword123!');
  await prisma.user.upsert({
    where: { email: 'admin@platform.internal' },
    create: {
      email: 'admin@platform.internal',
      username: 'platform_admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      referralCode: 'ADMIN001',
      profile: {
        create: {
          fullName: 'Platform Super Administrator',
        },
      },
      wallet: {
        create: {
          availableBalance: 0,
          pendingBalance: 0,
          lockedBalance: 0,
          currency: 'NGN',
        },
      },
    },
    update: {
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  logger.info('✅ Clean slate established. Only Super Administrator and standard plans exist.');
}

main()
  .catch((e) => {
    logger.error('Clean slate setup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
