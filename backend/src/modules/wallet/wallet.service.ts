import { prisma } from '../../prisma/client.js';
import { NotFoundError } from '../../utils/errors.js';

export class WalletService {
  public static async getWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          availableBalance: 0,
          pendingBalance: 0,
          lockedBalance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
        },
      });
    }

    // Fetch active conditional rewards with progress
    const lockedRewards = await prisma.reward.findMany({
      where: {
        userId,
        status: 'LOCKED',
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsedLockedRewards = lockedRewards.map((r) => {
      let conditions = null;
      if (r.lockedConditionJson) {
        try {
          conditions = JSON.parse(r.lockedConditionJson);
        } catch {}
      }
      return {
        id: r.id,
        amount: r.amount,
        currency: r.currency,
        sourceType: r.sourceType,
        conditions,
        createdAt: r.createdAt,
      };
    });

    // Fetch user active membership & prior withdrawals for withdrawal rule computation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
        },
      },
    });

    const activeMembership = user?.memberships[0] || null;
    const userTier = activeMembership?.plan?.tier || (user?.role === 'CREATOR' ? 'CREATOR' : 'FREE_STARTER');

    const priorWithdrawalsCount = await prisma.withdrawal.count({
      where: {
        userId,
        status: { in: ['COMPLETED', 'PROCESSING', 'PENDING_REVIEW', 'REQUESTED'] },
      },
    });
    const isFirstWithdrawal = wallet.totalWithdrawn === 0 && priorWithdrawalsCount === 0;

    // Count qualified referrals
    const totalQualified = await prisma.referral.count({
      where: { referrerId: userId, status: 'QUALIFIED' },
    });
    const premiumQualified = await prisma.referral.count({
      where: {
        referrerId: userId,
        status: 'QUALIFIED',
        referred: {
          memberships: {
            some: {
              status: 'ACTIVE',
              plan: { tier: 'PREMIUM' },
            },
          },
        },
      },
    });

    let minWithdrawalAmount = 2000;
    if (userTier === 'PREMIUM') {
      minWithdrawalAmount = isFirstWithdrawal ? 25000 : 2000;
    } else if (userTier === 'BASIC') {
      minWithdrawalAmount = isFirstWithdrawal ? 10000 : 5000;
    } else {
      minWithdrawalAmount = 2000;
    }

    return {
      wallet: {
        id: wallet.id,
        availableBalance: wallet.availableBalance,
        pendingBalance: wallet.pendingBalance,
        lockedBalance: wallet.lockedBalance,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        currency: wallet.currency,
      },
      conditionalRewards: parsedLockedRewards,
      activeMembership: activeMembership
        ? {
            id: activeMembership.id,
            planName: activeMembership.plan.name,
            tier: activeMembership.plan.tier,
            expiresAt: activeMembership.expiresAt,
          }
        : null,
      withdrawalRules: {
        userTier,
        isFirstWithdrawal,
        minWithdrawalAmount,
        totalQualified,
        premiumQualified,
        requiredTotalReferrals: 10,
        requiredPremiumReferrals: userTier === 'PREMIUM' ? 5 : 0,
      },
    };
  }

  public static async getTransactionHistory(
    userId: string,
    query: { limit?: number; offset?: number; bucket?: string }
  ) {
    const where: any = { userId };
    if (query.bucket) where.bucket = query.bucket;

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit || 30,
        skip: query.offset || 0,
      }),
      prisma.ledgerEntry.count({ where }),
    ]);

    return { entries, total };
  }
}
