import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/prisma/client.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { LedgerService } from '../src/modules/ledger/ledger.service.js';
import { WithdrawalService } from '../src/modules/withdrawals/withdrawal.service.js';

describe('WithdrawalService - Payout Lifecycle & Idempotency', () => {
  let userId: string;
  let adminId: string;

  beforeAll(async () => {
    const user = await AuthService.register({
      email: `wdraw_user_${Date.now()}@platform.internal`,
      username: `wdraw_user_${Date.now()}`,
      password: 'Password123!',
    });
    userId = user.user.id;

    const admin = await AuthService.register({
      email: `wdraw_admin_${Date.now()}@platform.internal`,
      username: `wdraw_admin_${Date.now()}`,
      password: 'Password123!',
    });
    adminId = admin.user.id;
    await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });

    // Credit user with ₦10,000 available balance
    await LedgerService.recordTransaction({
      userId,
      amount: 10000,
      direction: 'CREDIT',
      bucket: 'AVAILABLE',
      entryType: 'REWARD_CREDIT',
      referenceType: 'TEST',
      description: 'Initial balance for withdrawal testing',
    });
  });

  afterAll(async () => {
    await prisma.ledgerEntry.deleteMany({ where: { userId: { in: [userId, adminId] } } });
    await prisma.withdrawal.deleteMany({ where: { userId } });
    await prisma.wallet.deleteMany({ where: { userId: { in: [userId, adminId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, adminId] } } });
  });

  it('should reject withdrawal request below minimum limit of ₦2,000', async () => {
    await expect(
      WithdrawalService.requestWithdrawal(userId, {
        amount: 500,
        accountDetails: {
          bankName: 'Access Bank',
          accountNumber: '0123456789',
          accountName: 'Test Account',
        },
      })
    ).rejects.toThrow('Minimum withdrawal amount');
  });

  it('should place requested funds on hold and create a pending withdrawal record', async () => {
    const { withdrawal, isDuplicate } = await WithdrawalService.requestWithdrawal(userId, {
      amount: 3000,
      accountDetails: {
        bankName: 'Zenith Bank',
        accountNumber: '1234567890',
        accountName: 'John Doe',
      },
      idempotencyKey: 'idemp_test_wdraw_1',
    });

    expect(isDuplicate).toBe(false);
    expect(withdrawal.status).toBe('PENDING_REVIEW');
    expect(withdrawal.amount).toBe(3000);

    // Verify wallet available balance reduced by 3000 (from 10,000 to 7,000)
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(wallet?.availableBalance).toBe(7000);
  });

  it('should return existing withdrawal on duplicate idempotency key', async () => {
    const { withdrawal, isDuplicate } = await WithdrawalService.requestWithdrawal(userId, {
      amount: 3000,
      accountDetails: {
        bankName: 'Zenith Bank',
        accountNumber: '1234567890',
        accountName: 'John Doe',
      },
      idempotencyKey: 'idemp_test_wdraw_1',
    });

    expect(isDuplicate).toBe(true);
    expect(withdrawal.amount).toBe(3000);
  });

  it('should refund funds to available balance when withdrawal is rejected by admin', async () => {
    const { withdrawal } = await WithdrawalService.requestWithdrawal(userId, {
      amount: 2000,
      accountDetails: {
        bankName: 'Guaranty Trust Bank',
        accountNumber: '0987654321',
        accountName: 'Jane Doe',
      },
      idempotencyKey: 'idemp_test_wdraw_reject',
    });

    // Wallet is now at 5000 (7000 - 2000)
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(wallet?.availableBalance).toBe(5000);

    // Admin rejects withdrawal
    await WithdrawalService.processWithdrawalReview(
      withdrawal.id,
      adminId,
      'REJECT',
      'Account name mismatch'
    );

    // Wallet should be refunded back to 7000
    wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(wallet?.availableBalance).toBe(7000);

    const updatedWithdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawal.id } });
    expect(updatedWithdrawal?.status).toBe('REJECTED');
  });

  it('should finalize payout when withdrawal is approved by admin', async () => {
    const { withdrawal } = await WithdrawalService.requestWithdrawal(userId, {
      amount: 2500,
      accountDetails: {
        bankName: 'First Bank',
        accountNumber: '1122334455',
        accountName: 'John Doe',
      },
      idempotencyKey: 'idemp_test_wdraw_approve',
    });

    // Admin approves
    await WithdrawalService.processWithdrawalReview(
      withdrawal.id,
      adminId,
      'APPROVE',
      'Approved for disbursement'
    );

    const updatedWithdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawal.id } });
    expect(updatedWithdrawal?.status).toBe('COMPLETED');
    expect(updatedWithdrawal?.processedAt).toBeDefined();

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    expect(wallet?.totalWithdrawn).toBe(2500);
  });
});
