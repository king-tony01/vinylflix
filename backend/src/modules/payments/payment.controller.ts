import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class PaymentController {
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

      const result = await PaymentService.processWebhook(provider, req.body, signature);
      res.json({ success: true, result });
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
