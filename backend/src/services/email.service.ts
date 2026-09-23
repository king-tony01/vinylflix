import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import {
  renderOtpVerificationEmail,
  renderWelcomePreVerifyEmail,
  renderWelcomeVerifiedEmail,
  renderWithdrawalRequestedEmail,
  renderWithdrawalSuccessEmail,
  renderSecurityLoginAlertEmail,
  renderAccountStatusEmail,
  type AccountStatusAction,
} from './email-templates/index.js';

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: config.nodeEnv === 'production',
        },
      });
    }
    return this.transporter;
  }

  /**
   * Generic internal mail dispatcher with fail-safe logging
   */
  private static async dispatchMail(
    toEmail: string,
    subject: string,
    html: string,
    fallbackText?: string
  ): Promise<boolean> {
    try {
      if (!config.email.pass || config.nodeEnv === 'test') {
        logger.info(`📧 [DEV/TEST EMAIL SIMULATION] To: ${toEmail} | Subject: "${subject}"`);
        return true;
      }

      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: config.email.from,
        to: toEmail,
        subject,
        html,
        text: fallbackText || subject,
      });

      logger.info(`✅ Email dispatched successfully to ${toEmail} [Subject: "${subject}"]`);
      return true;
    } catch (error: any) {
      logger.error(`❌ Failed to send email to ${toEmail}: ${error.message}`);
      logger.info(`📧 [FALLBACK SIMULATION] To: ${toEmail} | Subject: "${subject}"`);
      // In development environments, return true so registration/login/flows aren't blocked by missing local mail server
      return config.nodeEnv !== 'production';
    }
  }

  /**
   * 1. Send 6-digit email verification OTP
   */
  public static async sendVerificationEmail(
    toEmail: string,
    username: string,
    code: string
  ): Promise<boolean> {
    const { subject, html } = renderOtpVerificationEmail({
      username,
      code,
      verificationUrl: `${config.appUrl}/verify-email`,
    });
    return this.dispatchMail(
      toEmail,
      subject,
      html,
      `Your Vinylflix verification code is: ${code}. It expires in 15 minutes.`
    );
  }

  /**
   * 2. Send Initial Welcome & Pre-Verification Onboarding
   */
  public static async sendWelcomePreVerifyEmail(
    toEmail: string,
    username: string,
    code: string
  ): Promise<boolean> {
    const { subject, html } = renderWelcomePreVerifyEmail({
      username,
      code,
      appUrl: config.appUrl,
    });
    return this.dispatchMail(
      toEmail,
      subject,
      html,
      `Welcome to Vinylflix, ${username}! Complete your activation with code: ${code}`
    );
  }

  /**
   * 3. Send Post-Verification Quick Start & Earning Guide
   */
  public static async sendWelcomeVerifiedEmail(
    toEmail: string,
    username: string,
    referralCode: string
  ): Promise<boolean> {
    const { subject, html } = renderWelcomeVerifiedEmail({
      username,
      referralCode,
      appUrl: config.appUrl,
    });
    return this.dispatchMail(
      toEmail,
      subject,
      html,
      `Your Vinylflix account is verified! Log in at ${config.appUrl} to start earning.`
    );
  }

  /**
   * 4. Send Withdrawal Requested / Processing Receipt
   */
  public static async sendWithdrawalRequestedEmail(
    toEmail: string,
    username: string,
    data: {
      amount: number;
      fee: number;
      netAmount: number;
      currency?: string;
      bankName: string;
      accountNumberMasked: string;
      accountName: string;
      reference: string;
    }
  ): Promise<boolean> {
    const { subject, html } = renderWithdrawalRequestedEmail({
      username,
      amount: data.amount,
      fee: data.fee,
      netAmount: data.netAmount,
      currency: data.currency || config.businessDefaults.currency,
      bankName: data.bankName,
      accountNumberMasked: data.accountNumberMasked,
      accountName: data.accountName,
      reference: data.reference,
      appUrl: config.appUrl,
    });
    return this.dispatchMail(
      toEmail,
      subject,
      html,
      `Your withdrawal request of ${data.netAmount} is currently processing.`
    );
  }

  /**
   * 5. Send Successful Withdrawal / Payout Sent Notification
   */
  public static async sendWithdrawalSuccessEmail(
    toEmail: string,
    username: string,
    data: {
      netAmount: number;
      currency?: string;
      bankName: string;
      accountNumberMasked: string;
      reference: string;
      processedAt?: string;
    }
  ): Promise<boolean> {
    const { subject, html } = renderWithdrawalSuccessEmail({
      username,
      netAmount: data.netAmount,
      currency: data.currency || config.businessDefaults.currency,
      bankName: data.bankName,
      accountNumberMasked: data.accountNumberMasked,
      reference: data.reference,
      processedAt: data.processedAt,
      appUrl: config.appUrl,
    });
    return this.dispatchMail(
      toEmail,
      subject,
      html,
      `Funds sent! ${data.netAmount} has been transferred to your bank account.`
    );
  }

  /**
   * 6. Send New Login / Security Alert
   */
  public static async sendLoginAlertEmail(
    toEmail: string,
    username: string,
    data: {
      ipAddress: string;
      userAgent: string;
      deviceType?: string;
      location?: string;
      timestamp?: string;
    }
  ): Promise<boolean> {
    const { subject, html } = renderSecurityLoginAlertEmail({
      username,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceType: data.deviceType,
      location: data.location,
      timestamp: data.timestamp,
      resetPasswordUrl: `${config.appUrl}/login`,
    });
    return this.dispatchMail(
      toEmail,
      subject,
      html,
      `Security Alert: New sign-in to your Vinylflix account from IP ${data.ipAddress}.`
    );
  }

  /**
   * 7. Send Account Moderation / Status Update Notice
   */
  public static async sendAccountStatusAlertEmail(
    toEmail: string,
    username: string,
    data: {
      action: AccountStatusAction;
      reason?: string;
      effectiveDate?: string;
    }
  ): Promise<boolean> {
    const { subject, html } = renderAccountStatusEmail({
      username,
      action: data.action,
      reason: data.reason,
      effectiveDate: data.effectiveDate,
      appealUrl: `${config.appUrl}/support`,
    });
    return this.dispatchMail(
      toEmail,
      subject,
      html,
      `Important Notice regarding your Vinylflix account status: ${data.action}`
    );
  }
}
