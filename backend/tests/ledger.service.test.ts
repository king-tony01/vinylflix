import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/prisma/client.js';
import { LedgerService } from '../src/modules/ledger/ledger.service.js';
import { hashPassword, generateReferralCode } from '../src/utils/crypto.js';

describe('LedgerService - Financial Ledger Accounting', () => {
  let testUserId: string;

  beforeAll(async () => {
    const passwordHash = await hashPassword('TestPass123!');
    const user = await prisma.user.create({
      data: {
        email: `ledger_test_${Date.now()}@platform.internal`,
        username: `ledger_user_${Date.now()}`,
        passwordHash,
        referralCode: generateReferralCode(8),
        wallet: {
          create: {
            availableBalance: 0,
            pendingBalance: 0,
            lockedBalance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
            currency: 'NGN',
          },
        },
      },
      include: { wallet: true },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.ledgerEntry.deleteMany({ where: { userId: testUserId } });
    await prisma.reward.deleteMany({ where: { userId: testUserId } });
    await prisma.wallet.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should atomically credit available balance and record an immutable ledger entry', async () => {
    const { ledgerEntry, wallet } = await LedgerService.recordTransaction({
      userId: testUserId,
      amount: 500,
      currency: 'NGN',
      direction: 'CREDIT',
      bucket: 'AVAILABLE',
      entryType: 'REWARD_CREDIT',
      referenceType: 'TEST',
      description: 'Test watch reward credit',
    });

    expect(ledgerEntry).toBeDefined();
    expect(ledgerEntry.amount).toBe(500);
    expect(ledgerEntry.bucket).toBe('AVAILABLE');
    expect(wallet.availableBalance).toBe(500);
    expect(wallet.totalEarned).toBe(500);
  });

  it('should credit locked balance for conditional rewards', async () => {
    const { ledgerEntry, wallet } = await LedgerService.recordTransaction({
      userId: testUserId,
      amount: 10000,
      currency: 'NGN',
      direction: 'CREDIT',
      bucket: 'LOCKED',
      entryType: 'CONDITIONAL_LOCK',
      referenceType: 'MEMBERSHIP',
      description: 'Conditional membership bonus locked',
    });

    expect(ledgerEntry.bucket).toBe('LOCKED');
    expect(wallet.lockedBalance).toBe(10000);
    expect(wallet.availableBalance).toBe(500); // untouched
  });

  it('should reject debit when insufficient funds are available', async () => {
    await expect(
      LedgerService.recordTransaction({
        userId: testUserId,
        amount: 2000,
        currency: 'NGN',
        direction: 'DEBIT',
        bucket: 'AVAILABLE',
        entryType: 'WITHDRAWAL_HOLD',
        referenceType: 'WITHDRAWAL',
        description: 'Overdrawing available funds',
      })
    ).rejects.toThrow('Insufficient available balance');
  });

  it('should unlock conditional reward from LOCKED bucket to AVAILABLE bucket', async () => {
    // Create reward record
    const reward = await prisma.reward.create({
      data: {
        userId: testUserId,
        sourceType: 'MEMBERSHIP_REWARD',
        amount: 10000,
        currency: 'NGN',
        status: 'LOCKED',
      },
    });

    await LedgerService.unlockConditionalReward(testUserId, reward.id, 10000);

    const updatedWallet = await prisma.wallet.findUnique({ where: { userId: testUserId } });
    const updatedReward = await prisma.reward.findUnique({ where: { id: reward.id } });

    expect(updatedReward?.status).toBe('AVAILABLE');
    expect(updatedWallet?.lockedBalance).toBe(0);
    expect(updatedWallet?.availableBalance).toBe(10500); // 500 + 10000
  });

  it('should accurately reconcile wallet balance with immutable ledger entries sum', async () => {
    const reconciliation = await LedgerService.reconcileWallet(testUserId);
    expect(reconciliation.isBalanced).toBe(true);
    expect(reconciliation.discrepancy.available).toBe(0);
    expect(reconciliation.discrepancy.locked).toBe(0);
  });
});
