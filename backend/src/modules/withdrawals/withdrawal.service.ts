import { prisma } from '../../prisma/client.js';
import { ConfigService } from '../config/config.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { RiskService } from '../risk/risk.service.js';
import { AuditService } from '../audit/audit.service.js';
import { generateIdempotencyKey } from '../../utils/crypto.js';
import { AppError, NotFoundError } from '../../utils/errors.js';
import { requestWithdrawalSchema } from './withdrawal.dto.js';
import { z } from 'zod';

export class WithdrawalService {
  public static async requestWithdrawal(
    userId: string,
    data: z.infer<typeof requestWithdrawalSchema>,
    ipAddress?: string
  ) {
    const rules = await ConfigService.getBusinessRules();
    const minAmount = rules.minWithdrawalAmount;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
        },
        riskScore: true,
      },
    });

    if (!user) throw new NotFoundError('User not found');
    if (!user.wallet) throw new NotFoundError('Wallet not found');

    if (user.status === 'SUSPENDED' || user.status === 'RESTRICTED') {
      throw new AppError('Account is restricted from initiating withdrawals');
    }

    const activeMembership = user.memberships[0];
    const userTier = activeMembership?.plan?.tier || (user.role === 'CREATOR' ? 'CREATOR' : 'FREE_STARTER');

    if (userTier === 'FREE_STARTER' && user.role !== 'CREATOR' && user.role !== 'ADMIN') {
      throw new AppError('An active paid membership is required to initiate withdrawals.');
    }

    // Check prior completed/pending withdrawals to differentiate first-time vs subsequent
    const priorWithdrawalsCount = await prisma.withdrawal.count({
      where: {
        userId,
        status: { in: ['COMPLETED', 'PROCESSING', 'PENDING_REVIEW', 'REQUESTED'] },
      },
    });
    const isFirstWithdrawal = user.wallet.totalWithdrawn === 0 && priorWithdrawalsCount === 0;

    // Count qualified referrals & Premium qualified referrals for milestone validation
    const totalQualifiedReferrals = await prisma.referral.count({
      where: { referrerId: userId, status: 'QUALIFIED' },
    });
    const premiumQualifiedReferrals = await prisma.referral.count({
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

    if (userTier === 'PREMIUM') {
      if (isFirstWithdrawal) {
        if (totalQualifiedReferrals < 10 || premiumQualifiedReferrals < 5) {
          throw new AppError(
            `First-time withdrawal for Premium members requires 10 qualified referrals, including at least 5 Premium members. You currently have ${totalQualifiedReferrals}/10 total and ${premiumQualifiedReferrals}/5 Premium members.`
          );
        }
        if (data.amount < 25000) {
          throw new AppError(
            `First-time milestone withdrawal amount for Premium members is ₦25,000.`
          );
        }
      } else {
        // Subsequent withdrawals for Premium
        if (data.amount < 2000) {
          throw new AppError(`Minimum withdrawal amount for Premium members is ₦2,000.`);
        }
      }
    } else if (userTier === 'BASIC') {
      if (isFirstWithdrawal) {
        if (totalQualifiedReferrals < 10) {
          throw new AppError(
            `First-time withdrawal for Basic members requires at least 10 qualified referrals. You currently have ${totalQualifiedReferrals}/10.`
          );
        }
        if (data.amount < 10000) {
          throw new AppError(
            `First-time milestone withdrawal amount for Basic members is ₦10,000.`
          );
        }
      } else {
        // Subsequent withdrawals for Basic: min ₦5,000
        if (data.amount < 5000) {
          throw new AppError(`Minimum withdrawal amount from referral earnings for Basic members is ₦5,000.`);
        }
      }
    } else {
      // Creator, Admin or standard: min ₦2,000
      if (data.amount < 2000) {
        throw new AppError(`Minimum withdrawal amount is ₦2,000.`);
      }
    }

    if (user.wallet.availableBalance < data.amount) {
      throw new AppError(
        `Insufficient available balance. You have ${rules.currency} ${user.wallet.availableBalance.toLocaleString()}, requested ${rules.currency} ${data.amount.toLocaleString()}`
      );
    }

    // Idempotency check
    const idempotencyKey = data.idempotencyKey || generateIdempotencyKey('wdraw');
    const existing = await prisma.withdrawal.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return { withdrawal: existing, isDuplicate: true };
    }

    // Evaluate withdrawal risk
    const risk = await RiskService.evaluateRisk({
      userId,
      entityType: 'WITHDRAWAL',
      ipAddress,
      metadata: { amount: data.amount, bank: data.accountDetails.bankName },
    });

    const fee = (data.amount * rules.platformFeePercent) / 100;
    const netAmount = data.amount - fee;

    return prisma.$transaction(async (tx) => {
      // 1. Create Withdrawal Record
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          walletId: user.wallet!.id,
          amount: data.amount,
          currency: rules.currency,
          fee,
          netAmount,
          accountDetailsJson: JSON.stringify(data.accountDetails),
          status: 'PENDING_REVIEW',
          idempotencyKey,
        },
      });

      // 2. Debit AVAILABLE balance (placed on hold)
      await LedgerService.recordTransaction(
        {
          userId,
          amount: data.amount,
          currency: rules.currency,
          direction: 'DEBIT',
          bucket: 'AVAILABLE',
          entryType: 'WITHDRAWAL_HOLD',
          referenceType: 'WITHDRAWAL',
          referenceId: withdrawal.id,
          withdrawalId: withdrawal.id,
          description: `Withdrawal request placed on hold: ${rules.currency} ${data.amount}`,
        },
        tx
      );

      await AuditService.log(
        {
          actorId: userId,
          action: 'WITHDRAWAL_REQUESTED',
          targetType: 'WITHDRAWAL',
          targetId: withdrawal.id,
          newState: { amount: data.amount, netAmount, fee },
          ipAddress,
        },
        tx
      );

      return { withdrawal, isDuplicate: false };
    });
  }

  public static async processWithdrawalReview(
    withdrawalId: string,
    adminId: string,
    action: 'APPROVE' | 'REJECT',
    reviewNote?: string
  ) {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true },
    });

    if (!withdrawal) throw new NotFoundError('Withdrawal request not found');
    if (withdrawal.status !== 'PENDING_REVIEW' && withdrawal.status !== 'REQUESTED') {
      throw new AppError(`Withdrawal is already in status ${withdrawal.status}`);
    }

    if (action === 'APPROVE') {
      const updated = await prisma.$transaction(async (tx) => {
        const res = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'COMPLETED',
            reviewedById: adminId,
            reviewNote: reviewNote || 'Approved by admin',
            processedAt: new Date(),
          },
        });

        // Record final WITHDRAWAL_PAYOUT in ledger
        await LedgerService.recordTransaction(
          {
            userId: withdrawal.userId,
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            direction: 'DEBIT',
            bucket: 'AVAILABLE',
            entryType: 'WITHDRAWAL_PAYOUT',
            referenceType: 'WITHDRAWAL',
            referenceId: withdrawal.id,
            withdrawalId: withdrawal.id,
            description: `Withdrawal payout finalized: ${withdrawal.currency} ${withdrawal.amount}`,
          },
          tx
        );

        return res;
      });

      await AuditService.log({
        actorId: adminId,
        action: 'WITHDRAWAL_APPROVED',
        targetType: 'WITHDRAWAL',
        targetId: withdrawalId,
        reason: reviewNote,
      });

      return updated;
    } else {
      // REJECT: Refund funds back to AVAILABLE bucket via compensating entry
      const updated = await prisma.$transaction(async (tx) => {
        const res = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'REJECTED',
            reviewedById: adminId,
            reviewNote: reviewNote || 'Rejected by admin review',
            processedAt: new Date(),
          },
        });

        await LedgerService.recordTransaction(
          {
            userId: withdrawal.userId,
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            direction: 'CREDIT',
            bucket: 'AVAILABLE',
            entryType: 'WITHDRAWAL_REFUND',
            referenceType: 'WITHDRAWAL',
            referenceId: withdrawal.id,
            withdrawalId: withdrawal.id,
            description: `Refund of rejected withdrawal: ${withdrawal.currency} ${withdrawal.amount}`,
          },
          tx
        );

        return res;
      });

      await AuditService.log({
        actorId: adminId,
        action: 'WITHDRAWAL_REJECTED',
        targetType: 'WITHDRAWAL',
        targetId: withdrawalId,
        reason: reviewNote,
      });

      return updated;
    }
  }

  public static async getUserWithdrawals(userId: string) {
    return prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
