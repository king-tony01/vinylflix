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
