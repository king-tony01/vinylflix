import { prisma } from '../../prisma/client.js';
import { PaymentProviderFactory } from './payment.provider.js';
import { hashPayload } from '../../utils/crypto.js';
import { AppError, NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class PaymentService {
  public static async initializePayment(params: {
    userId: string;
    amount: number;
    currency?: string;
    purpose: 'MEMBERSHIP_PURCHASE' | 'CAMPAIGN_BUDGET';
    metadata?: any;
    idempotencyKey?: string;
    callbackUrl?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });
    if (!user) throw new NotFoundError('User not found');

    const currency = params.currency || 'NGN';
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
