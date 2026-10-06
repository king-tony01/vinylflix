import { prisma } from '../../prisma/client.js';
import { PaymentProviderFactory } from './payment.provider.js';
import { hashPayload } from '../../utils/crypto.js';
import { AppError, NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';
import { EmailService } from '../../services/email.service.js';
import { AuditService } from '../audit/audit.service.js';

export class PaymentService {
  /**
   * Returns current platform bank transfer details
   */
  public static getBankTransferDetails() {
    return {
      bankName: config.manualBankDetails.bankName,
      accountName: config.manualBankDetails.accountName,
      accountNumber: config.manualBankDetails.accountNumber,
      instructions: config.manualBankDetails.instructions,
      currency: config.businessDefaults.currency,
      provider: config.payment.provider,
    };
  }

  /**
   * Initialize a payment (supports Paystack gateway or manual fallback)
   */
  public static async initializePayment(params: {
    userId: string;
    amount: number;
    currency?: string;
    purpose: 'MEMBERSHIP_PURCHASE' | 'CAMPAIGN_BUDGET' | 'WALLET_FUNDING';
    metadata?: any;
    idempotencyKey?: string;
    callbackUrl?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });
    if (!user) throw new NotFoundError('User not found');

    const currency = params.currency || config.businessDefaults.currency;
    const reference = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // If idempotencyKey provided, check existing
    if (params.idempotencyKey) {
      const existing = await prisma.payment.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existing) {
        return {
          payment: existing,
          paymentUrl: `/api/v1/payments/verify/${existing.reference}`,
          isDuplicate: true,
        };
      }
    }

    const provider = PaymentProviderFactory.getProvider();
    const initResult = await provider.initializePayment({
      userId: user.id,
      email: user.email,
      amount: params.amount,
      currency,
      purpose: params.purpose,
      reference,
      callbackUrl: params.callbackUrl,
      metadata: params.metadata,
    });

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        provider: initResult.provider,
        reference,
        amount: params.amount,
        currency,
        purpose: params.purpose,
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
        status: 'PENDING',
        idempotencyKey: params.idempotencyKey || null,
      },
    });

    return {
      payment,
      paymentUrl: initResult.paymentUrl,
      accessCode: initResult.accessCode,
      isDuplicate: false,
    };
  }

  /**
   * Submit direct manual bank transfer receipt and sender details
   */
  public static async submitManualBankTransfer(params: {
    userId: string;
    amount: number;
    currency?: string;
    purpose: 'MEMBERSHIP_PURCHASE' | 'CAMPAIGN_BUDGET' | 'WALLET_FUNDING';
    planId?: string;
    planName?: string;
    senderAccountName: string;
    senderBankName: string;
    proofOfPaymentUrl: string;
    notes?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundError('User not found');

    if (!params.senderAccountName || !params.senderBankName) {
      throw new AppError('Sender account name and sender bank name are required.', 400);
    }

    if (!params.proofOfPaymentUrl) {
      throw new AppError('Proof of payment receipt / image is required.', 400);
    }

    const currency = params.currency || config.businessDefaults.currency;
    const reference = `bt_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const metadata = {
      planId: params.planId,
      planName: params.planName,
      notes: params.notes,
      senderAccountName: params.senderAccountName,
      senderBankName: params.senderBankName,
    };

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        provider: 'MANUAL_BANK_TRANSFER',
        reference,
        amount: params.amount,
        currency,
        purpose: params.purpose,
        metadataJson: JSON.stringify(metadata),
        status: 'PENDING_REVIEW',
        proofOfPaymentUrl: params.proofOfPaymentUrl,
        senderAccountName: params.senderAccountName.trim(),
        senderBankName: params.senderBankName.trim(),
      },
    });

    // 1. Create in-app notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Bank Transfer Submitted',
        message: `Your payment of ₦${params.amount.toLocaleString()} (Ref: ${reference}) has been received and is pending verification.`,
        type: 'INFO',
        metadataJson: JSON.stringify({ reference, amount: params.amount, paymentId: payment.id }),
      },
    });

    // 2. Dispatch user email notification
    EmailService.sendManualPaymentSubmittedEmail(user.email, user.username, {
      amount: params.amount,
      currency,
      purpose: params.purpose,
      planName: params.planName,
      senderBankName: params.senderBankName,
      senderAccountName: params.senderAccountName,
      reference,
    }).catch((err) => logger.error(`Error sending manual payment submitted email: ${err.message}`));

    logger.info(`[PAYMENT] Manual bank transfer submitted: ${reference} for User ${user.id} (${params.amount} ${currency})`);

    return payment;
  }

  /**
   * Get user payment history
   */
  public static async getUserPayments(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * List pending manual bank transfers for admin review
   */
  public static async listPendingManualPayments(query: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      provider: 'MANUAL_BANK_TRANSFER',
    };

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { reference: { contains: query.search } },
        { senderAccountName: { contains: query.search } },
        { senderBankName: { contains: query.search } },
        { user: { username: { contains: query.search } } },
        { user: { email: { contains: query.search } } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        take: query.limit || 50,
        skip: query.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              role: true,
              profile: true,
              wallet: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  /**
   * Admin reviews and approves or rejects a manual payment
   */
  public static async reviewManualPayment(params: {
    paymentId: string;
    adminId: string;
    action: 'APPROVE' | 'REJECT';
    adminNote?: string;
  }) {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { user: true },
    });

    if (!payment) throw new NotFoundError('Payment record not found');

    if (payment.status === 'SETTLED') {
      throw new AppError('This payment has already been approved and settled.', 400);
    }

    let planName = 'Membership';
    if (payment.metadataJson) {
      try {
        const meta = JSON.parse(payment.metadataJson);
        if (meta.planName) planName = meta.planName;
      } catch {}
    }

    if (params.action === 'APPROVE') {
      // Settle payment (activates membership / updates user role)
      await this.settlePayment(payment.id);

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SETTLED',
          reviewedById: params.adminId,
          reviewedAt: new Date(),
          adminNote: params.adminNote || 'Approved by Admin',
        },
        include: { user: true },
      });

      // Audit log
      await AuditService.log({
        actorId: params.adminId,
        action: 'MANUAL_PAYMENT_APPROVED',
        targetType: 'PAYMENT',
        targetId: payment.id,
        reason: params.adminNote || 'Manual transfer verified and approved',
        newState: { status: 'SETTLED', reference: payment.reference, amount: payment.amount },
      });

      // In-app notification
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Approved! 🎉',
          message: `Your payment of ₦${payment.amount.toLocaleString()} has been approved. Your ${planName} is now active!`,
          type: 'REWARD',
          metadataJson: JSON.stringify({ reference: payment.reference, paymentId: payment.id }),
        },
      });

      // User email dispatch
      EmailService.sendManualPaymentApprovedEmail(payment.user.email, payment.user.username, {
        amount: payment.amount,
        currency: payment.currency,
        planName,
        reference: payment.reference,
      }).catch((err) => logger.error(`Error sending manual payment approved email: ${err.message}`));

      return updated;
    } else {
      // REJECT
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REJECTED',
          reviewedById: params.adminId,
          reviewedAt: new Date(),
          adminNote: params.adminNote || 'Transfer receipt could not be verified.',
        },
        include: { user: true },
      });

      // Audit log
      await AuditService.log({
        actorId: params.adminId,
        action: 'MANUAL_PAYMENT_REJECTED',
        targetType: 'PAYMENT',
        targetId: payment.id,
        reason: params.adminNote || 'Payment rejected during manual verification',
        newState: { status: 'REJECTED', reference: payment.reference },
      });

      // In-app notification
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Verification Failed',
          message: `Your payment submission (Ref: ${payment.reference}) was not approved: ${params.adminNote || 'Receipt could not be verified.'}`,
          type: 'SECURITY',
          metadataJson: JSON.stringify({ reference: payment.reference, paymentId: payment.id }),
        },
      });

      // User email dispatch
      EmailService.sendManualPaymentRejectedEmail(payment.user.email, payment.user.username, {
        amount: payment.amount,
        currency: payment.currency,
        planName,
        reference: payment.reference,
        reason: params.adminNote,
      }).catch((err) => logger.error(`Error sending manual payment rejected email: ${err.message}`));

      return updated;
    }
  }

  public static async listBanks(country = 'nigeria') {
    const provider = PaymentProviderFactory.getProvider();
    return provider.listBanks(country);
  }

  public static async resolveAccount(accountNumber: string, bankCode: string) {
    if (!accountNumber || !bankCode) {
      throw new AppError('Account number and bank code are required', 400);
    }
    const provider = PaymentProviderFactory.getProvider();
    return provider.resolveAccount(accountNumber.trim(), bankCode.trim());
  }

  public static async verifyPayment(reference: string) {
    const payment = await prisma.payment.findUnique({
      where: { reference },
    });
    if (!payment) throw new NotFoundError('Payment record not found');

    if (payment.status === 'SETTLED') {
      return { status: 'SETTLED', payment };
    }

    if (payment.provider === 'MANUAL_BANK_TRANSFER') {
      return { status: payment.status, payment };
    }

    const provider = PaymentProviderFactory.getProvider(payment.provider);
    const verification = await provider.verifyPayment(reference);

    if (verification.isSuccessful) {
      await this.settlePayment(payment.id);
      const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
      return { status: 'SETTLED', payment: updated, verification };
    }

    return { status: payment.status, payment, verification };
  }

  public static async processWebhook(
    providerName: string,
    rawPayload: any,
    signature?: string,
    rawBodyStr?: string
  ) {
    const payloadStr = rawBodyStr || (typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload));
    const payloadHash = hashPayload(payloadStr);

    // 1. Check duplicate webhook payload (Idempotency)
    const existingLog = await prisma.paymentWebhookLog.findUnique({
      where: { payloadHash },
    });

    if (existingLog && existingLog.processed) {
      logger.info(`[WEBHOOK] Duplicate webhook event ignored (hash: ${payloadHash})`);
      return { status: 'already_processed' };
    }

    const provider = PaymentProviderFactory.getProvider(providerName);
    const isValidSignature = signature ? provider.verifyWebhookSignature(signature, payloadStr) : true;
    if (!isValidSignature) {
      logger.warn(`[WEBHOOK] Invalid signature received for ${providerName} webhook event`);
      throw new AppError('Invalid webhook signature', 400);
    }

    // Parse payload details
    const event = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    const reference = event.reference || event.data?.reference;
    const isSuccessful =
      event.status === 'success' ||
      event.data?.status === 'success' ||
      event.event === 'charge.success';

    // Log webhook
    await prisma.paymentWebhookLog.upsert({
      where: { payloadHash },
      create: {
        provider: providerName,
        eventType: event.event || 'payment.update',
        payloadHash,
        rawPayload: payloadStr,
        processed: false,
      },
      update: {},
    });

    if (!reference) {
      return { status: 'ignored_no_reference' };
    }

    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      logger.warn(`[WEBHOOK] Payment with reference ${reference} not found in database`);
      return { status: 'payment_not_found' };
    }

    if (payment.status === 'SETTLED') {
      await prisma.paymentWebhookLog.update({
        where: { payloadHash },
        data: { processed: true },
      });
      return { status: 'already_settled' };
    }

    if (isSuccessful) {
      await this.settlePayment(payment.id);
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
    }

    await prisma.paymentWebhookLog.update({
      where: { payloadHash },
      data: { processed: true },
    });

    return { status: 'processed', paymentId: payment.id };
  }

  public static async settlePayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.status === 'SETTLED') return;

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'SETTLED',
        settledAt: new Date(),
      },
    });

    logger.info(`[PAYMENT] Payment ${payment.reference} settled successfully`);

    // Settle target domain depending on purpose
    if (payment.purpose === 'MEMBERSHIP_PURCHASE' && payment.metadataJson) {
      const metadata = JSON.parse(payment.metadataJson);
      if (metadata.planId) {
        const { MembershipService } = await import('../memberships/membership.service.js');
        await MembershipService.activateMembership(payment.userId, metadata.planId, payment.id);
      }
    }
  }
}
