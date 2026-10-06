import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class PaymentController {
  public static async getBankDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const data = PaymentService.getBankTransferDetails();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async initialize(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await PaymentService.initializePayment({
        userId: req.user!.userId,
        amount: req.body.amount,
        currency: req.body.currency,
        purpose: req.body.purpose,
        metadata: req.body.metadata,
        idempotencyKey: req.body.idempotencyKey,
        callbackUrl: req.body.callbackUrl,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async submitManualTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        amount,
        currency,
        purpose,
        planId,
        planName,
        senderAccountName,
        senderBankName,
        proofOfPaymentUrl,
        notes,
      } = req.body;

      const data = await PaymentService.submitManualBankTransfer({
        userId: req.user!.userId,
        amount: parseFloat(amount),
        currency,
        purpose: purpose || 'MEMBERSHIP_PURCHASE',
        planId,
        planName,
        senderAccountName,
        senderBankName,
        proofOfPaymentUrl,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Proof of payment submitted successfully. Your transfer is now under verification.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getUserPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await PaymentService.getUserPayments(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async listManualPending(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const data = await PaymentService.listPendingManualPayments({
        status,
        search,
        limit,
        offset,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async reviewManualPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const paymentId = req.params.id as string;
      const { action, adminNote } = req.body;

      const data = await PaymentService.reviewManualPayment({
        paymentId,
        adminId: req.user!.userId,
        action,
        adminNote,
      });

      res.json({
        success: true,
        message: action === 'APPROVE' ? 'Payment approved and membership activated.' : 'Payment rejected.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const reference = req.params.reference as string;
      const data = await PaymentService.verifyPayment(reference);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async listBanks(req: Request, res: Response, next: NextFunction) {
    try {
      const country = (req.query.country as string) || 'nigeria';
      const banks = await PaymentService.listBanks(country);
      res.json({ success: true, data: { banks } });
    } catch (error) {
      next(error);
    }
  }

  public static async resolveAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNumber, bankCode } = req.body;
      const data = await PaymentService.resolveAccount(accountNumber, bankCode);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = (req.params.provider as string) || 'PAYSTACK';
      const signature = (req.headers['x-paystack-signature'] ||
        req.headers['x-webhook-signature'] ||
        req.headers['verif-hash']) as string | undefined;

      const rawBodyStr = (req as any).rawBody ? (req as any).rawBody.toString('utf8') : undefined;
      const result = await PaymentService.processWebhook(provider, req.body, signature, rawBodyStr);
      res.status(200).json({ success: true, result });
    } catch (error) {
      next(error);
    }
  }

  public static async simulatePaymentSuccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { reference } = req.body;
      const result = await PaymentService.processWebhook('PAYSTACK', {
        event: 'charge.success',
        status: 'success',
        reference,
      });
      res.json({ success: true, message: 'Payment settlement simulated', result });
    } catch (error) {
      next(error);
    }
  }
}
