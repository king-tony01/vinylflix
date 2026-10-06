import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/prisma/client.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { PaymentService } from '../src/modules/payments/payment.service.js';
import { MembershipService } from '../src/modules/memberships/membership.service.js';

describe('Manual Bank Transfer - Submission, Review, & Activation Lifecycle', () => {
  let userId: string;
  let adminId: string;
  let basicPlanId: string;
  let creatorPlanId: string;

  beforeAll(async () => {
    // Ensure standard plans exist
    await MembershipService.ensureDefaultPlansAndConfig();
    const plans = await prisma.membershipPlan.findMany();
    const basic = plans.find((p) => p.tier === 'BASIC');
    const creator = plans.find((p) => p.tier === 'CREATOR');
    basicPlanId = basic!.id;
    creatorPlanId = creator!.id;

    // Register test user
    const user = await AuthService.register({
      email: `mb_user_${Date.now()}@example.com`,
      username: `mb_user_${Date.now()}`,
      password: 'Password123!',
    });
    userId = user.user.id;

    // Register admin user
    const admin = await AuthService.register({
      email: `mb_admin_${Date.now()}@platform.internal`,
      username: `mb_admin_${Date.now()}`,
      password: 'Password123!',
    });
    adminId = admin.user.id;
    await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.payment.deleteMany({ where: { userId } });
    await prisma.membership.deleteMany({ where: { userId } });
    await prisma.reward.deleteMany({ where: { userId } });
    await prisma.ledgerEntry.deleteMany({ where: { userId } });
    await prisma.wallet.deleteMany({ where: { userId: { in: [userId, adminId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, adminId] } } });
  });

  it('1. should retrieve the configured bank transfer details (Opay, Okolie Amauche Anthony, 9063213825)', async () => {
    const details = PaymentService.getBankTransferDetails();
    expect(details.bankName).toBe('Opay');
    expect(details.accountName).toBe('Okolie Amauche Anthony');
    expect(details.accountNumber).toBe('9063213825');
    expect(details.currency).toBe('NGN');
  });

  it('2. should reject manual transfer submission when proof of payment receipt is missing', async () => {
    await expect(
      PaymentService.submitManualBankTransfer({
        userId,
        amount: 3000,
        purpose: 'MEMBERSHIP_PURCHASE',
        planId: basicPlanId,
        planName: 'Basic Member',
        senderAccountName: 'Okolie Anthony',
        senderBankName: 'OPay',
        proofOfPaymentUrl: '',
      })
    ).rejects.toThrow('Proof of payment receipt');
  });

  it('3. should successfully submit manual bank transfer and place in PENDING_REVIEW status', async () => {
    const payment = await PaymentService.submitManualBankTransfer({
      userId,
      amount: 3000,
      purpose: 'MEMBERSHIP_PURCHASE',
      planId: basicPlanId,
      planName: 'Basic Member',
      senderAccountName: 'Okolie Anthony',
      senderBankName: 'OPay',
      proofOfPaymentUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      notes: 'Transfer ref OPAY-12345678',
    });

    expect(payment).toBeDefined();
    expect(payment.status).toBe('PENDING_REVIEW');
    expect(payment.provider).toBe('MANUAL_BANK_TRANSFER');
    expect(payment.amount).toBe(3000);
    expect(payment.senderAccountName).toBe('Okolie Anthony');
    expect(payment.senderBankName).toBe('OPay');

    // Check in-app notification created
    const notifications = await prisma.notification.findMany({ where: { userId } });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toContain('Bank Transfer Submitted');
  });

  it('4. should list pending manual transfers for admin review', async () => {
    const res = await PaymentService.listPendingManualPayments({ status: 'PENDING_REVIEW' });
    expect(res.payments.length).toBeGreaterThan(0);
    const found = res.payments.find((p) => p.userId === userId);
    expect(found).toBeDefined();
    expect(found?.status).toBe('PENDING_REVIEW');
  });

  it('5. should reject a payment with a reason and notify the user', async () => {
    const userPayments = await PaymentService.getUserPayments(userId);
    const pending = userPayments.find((p) => p.status === 'PENDING_REVIEW')!;

    const rejected = await PaymentService.reviewManualPayment({
      paymentId: pending.id,
      adminId,
      action: 'REJECT',
      adminNote: 'Transfer narration does not match your username.',
    });

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.adminNote).toBe('Transfer narration does not match your username.');
  });

  it('6. should submit and approve a new Creator Plan payment and activate the membership', async () => {
    const newPayment = await PaymentService.submitManualBankTransfer({
      userId,
      amount: 15000,
      purpose: 'MEMBERSHIP_PURCHASE',
      planId: creatorPlanId,
      planName: 'Creator / Advertiser Tier',
      senderAccountName: 'Okolie Anthony',
      senderBankName: 'GTBank',
      proofOfPaymentUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    });

    const approved = await PaymentService.reviewManualPayment({
      paymentId: newPayment.id,
      adminId,
      action: 'APPROVE',
      adminNote: 'Funds received in Opay account.',
    });

    expect(approved.status).toBe('SETTLED');
    expect(approved.settledAt).toBeDefined();

    // Verify user role upgraded to CREATOR
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(updatedUser?.role).toBe('CREATOR');

    // Verify active membership created
    const activeMembership = await prisma.membership.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
    expect(activeMembership).toBeDefined();
    expect(activeMembership?.planId).toBe(creatorPlanId);
  });
});
