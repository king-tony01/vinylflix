import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { Prisma } from '@prisma/client';

export type LedgerDirection = 'CREDIT' | 'DEBIT';
export type LedgerBucket = 'AVAILABLE' | 'PENDING' | 'LOCKED';
export type LedgerEntryType =
  | 'REWARD_CREDIT'
  | 'CONDITIONAL_LOCK'
  | 'CONDITIONAL_UNLOCK'
  | 'WITHDRAWAL_HOLD'
  | 'WITHDRAWAL_PAYOUT'
  | 'WITHDRAWAL_REFUND'
  | 'REVERSAL_DEBIT'
  | 'ADMIN_CORRECTION';

export interface CreateLedgerEntryParams {
  userId: string;
  amount: number;
  currency?: string;
  direction: LedgerDirection;
  bucket: LedgerBucket;
  entryType: LedgerEntryType;
  referenceType: string;
  referenceId?: string | null;
  rewardId?: string | null;
  withdrawalId?: string | null;
  paymentId?: string | null;
  description: string;
}

export class LedgerService {
  /**
   * Records an immutable ledger entry and atomically updates wallet projections.
   */
  public static async recordTransaction(
    params: CreateLedgerEntryParams,
    tx?: Prisma.TransactionClient
  ): Promise<any> {
    const client = tx || prisma;
    const currency = params.currency || 'NGN';

    if (params.amount <= 0) {
      throw new AppError('Ledger transaction amount must be greater than zero');
    }

    // Ensure wallet exists for user
    let wallet = await client.wallet.findUnique({
      where: { userId: params.userId },
    });

    if (!wallet) {
      wallet = await client.wallet.create({
        data: {
          userId: params.userId,
          currency,
          availableBalance: 0,
          pendingBalance: 0,
          lockedBalance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
        },
      });
    }

    // Calculate balance projection updates
    const amountDelta = params.direction === 'CREDIT' ? params.amount : -params.amount;
    let availableDelta = 0;
    let pendingDelta = 0;
    let lockedDelta = 0;
    let totalEarnedDelta = 0;
    let totalWithdrawnDelta = 0;

    switch (params.bucket) {
      case 'AVAILABLE':
        availableDelta = amountDelta;
        if (params.direction === 'DEBIT' && wallet.availableBalance + availableDelta < 0) {
          throw new AppError('Insufficient available balance for transaction');
        }
        break;
      case 'PENDING':
        pendingDelta = amountDelta;
        if (params.direction === 'DEBIT' && wallet.pendingBalance + pendingDelta < 0) {
          throw new AppError('Insufficient pending balance for transaction');
        }
        break;
      case 'LOCKED':
        lockedDelta = amountDelta;
        if (params.direction === 'DEBIT' && wallet.lockedBalance + lockedDelta < 0) {
          throw new AppError('Insufficient locked balance for transaction');
        }
        break;
    }

    if (params.entryType === 'REWARD_CREDIT' || params.entryType === 'CONDITIONAL_LOCK') {
      totalEarnedDelta = params.amount;
    } else if (params.entryType === 'WITHDRAWAL_PAYOUT') {
      totalWithdrawnDelta = params.amount;
    }

    // 1. Create the immutable ledger record
    const ledgerEntry = await client.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        userId: params.userId,
        rewardId: params.rewardId || null,
        withdrawalId: params.withdrawalId || null,
        paymentId: params.paymentId || null,
        amount: params.amount,
        currency,
        direction: params.direction,
        bucket: params.bucket,
        entryType: params.entryType,
        referenceType: params.referenceType,
        referenceId: params.referenceId || null,
        description: params.description,
      },
    });

    // 2. Synchronize the wallet balance projection
    const updatedWallet = await client.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: availableDelta },
        pendingBalance: { increment: pendingDelta },
        lockedBalance: { increment: lockedDelta },
        totalEarned: { increment: totalEarnedDelta },
        totalWithdrawn: { increment: totalWithdrawnDelta },
        version: { increment: 1 },
      },
    });

    logger.info(
      `[LEDGER] Recorded ${params.direction} ${params.amount} ${currency} (${params.bucket}) for User ${params.userId}. Entry: ${ledgerEntry.id}`
    );

    return { ledgerEntry, wallet: updatedWallet };
  }

  /**
   * Performs an atomic conditional reward unlock:
   * Debits LOCKED bucket and credits AVAILABLE bucket.
   */
  public static async unlockConditionalReward(
    userId: string,
    rewardId: string,
    amount: number,
    description = 'Conditional reward unlocked upon milestone satisfaction'
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Debit LOCKED bucket
      await this.recordTransaction(
        {
          userId,
          amount,
          direction: 'DEBIT',
          bucket: 'LOCKED',
          entryType: 'CONDITIONAL_UNLOCK',
          referenceType: 'REWARD',
          referenceId: rewardId,
          rewardId,
          description: `Unlock transfer out: ${description}`,
        },
        tx
      );

      // 2. Credit AVAILABLE bucket
      const result = await this.recordTransaction(
        {
          userId,
          amount,
          direction: 'CREDIT',
          bucket: 'AVAILABLE',
          entryType: 'CONDITIONAL_UNLOCK',
          referenceType: 'REWARD',
          referenceId: rewardId,
          rewardId,
          description: `Unlock transfer in: ${description}`,
        },
        tx
      );

      // 3. Mark Reward as AVAILABLE
      await tx.reward.update({
        where: { id: rewardId },
        data: {
          status: 'AVAILABLE',
          unlockedAt: new Date(),
        },
      });

      return result;
    });
  }

  /**
   * Reverses a reward with compensating ledger entry.
   */
  public static async reverseReward(
    rewardId: string,
    adminId: string,
    reason: string
  ) {
    return prisma.$transaction(async (tx) => {
      const reward = await tx.reward.findUnique({
        where: { id: rewardId },
      });

      if (!reward) {
        throw new AppError('Reward not found to reverse');
      }

      if (reward.status === 'REVERSED') {
        throw new AppError('Reward has already been reversed');
      }

      const bucket: LedgerBucket =
        reward.status === 'LOCKED'
          ? 'LOCKED'
          : reward.status === 'PENDING'
          ? 'PENDING'
          : 'AVAILABLE';

      // Record compensating debit
      await this.recordTransaction(
        {
          userId: reward.userId,
          amount: reward.amount,
          currency: reward.currency,
          direction: 'DEBIT',
          bucket,
          entryType: 'REVERSAL_DEBIT',
          referenceType: 'REWARD_REVERSAL',
          referenceId: rewardId,
          rewardId,
          description: `Compensating reversal: ${reason}`,
        },
        tx
      );

      // Mark reward as REVERSED
      const updatedReward = await tx.reward.update({
        where: { id: rewardId },
        data: {
          status: 'REVERSED',
          reviewedById: adminId,
          reversalReason: reason,
        },
      });

      return updatedReward;
    });
  }

  /**
   * Reconciles wallet projection against sum of ledger entries.
   */
  public static async reconcileWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new AppError('Wallet not found');

    const entries = await prisma.ledgerEntry.findMany({
      where: { userId },
    });

    let computedAvailable = 0;
    let computedPending = 0;
    let computedLocked = 0;

    for (const e of entries) {
      const delta = e.direction === 'CREDIT' ? e.amount : -e.amount;
      if (e.bucket === 'AVAILABLE') computedAvailable += delta;
      else if (e.bucket === 'PENDING') computedPending += delta;
      else if (e.bucket === 'LOCKED') computedLocked += delta;
    }

    const isAvailableBalanced = Math.abs(wallet.availableBalance - computedAvailable) < 0.001;
    const isPendingBalanced = Math.abs(wallet.pendingBalance - computedPending) < 0.001;
    const isLockedBalanced = Math.abs(wallet.lockedBalance - computedLocked) < 0.001;

    return {
      isBalanced: isAvailableBalanced && isPendingBalanced && isLockedBalanced,
      walletBalances: {
        available: wallet.availableBalance,
        pending: wallet.pendingBalance,
        locked: wallet.lockedBalance,
      },
      ledgerCalculated: {
        available: computedAvailable,
        pending: computedPending,
        locked: computedLocked,
      },
      discrepancy: {
        available: wallet.availableBalance - computedAvailable,
        pending: wallet.pendingBalance - computedPending,
        locked: wallet.lockedBalance - computedLocked,
      },
    };
  }
}
