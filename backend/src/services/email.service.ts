import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

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
   * Send 6-digit email verification OTP
   */
  public static async sendVerificationEmail(
    toEmail: string,
    username: string,
    code: string
  ): Promise<boolean> {
    const subject = `${code} is your Vinylflix verification code`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vinylflix Email Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #090d16; min-height: 100vh; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background: #0f172a; border-radius: 24px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px 20px 32px; text-align: center; background: linear-gradient(135deg, rgba(255, 0, 145, 0.15) 0%, rgba(121, 40, 202, 0.1) 50%, rgba(54, 0, 153, 0.15) 100%); border-bottom: 1px solid #1e293b;">
              <div style="display: inline-block; padding: 12px; border-radius: 18px; background: #020617; border: 1px solid #334155; margin-bottom: 14px; box-shadow: 0 0 24px rgba(255, 0, 145, 0.3);">
                <span style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; background: linear-gradient(90deg, #ff0091, #a855f7, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #ff0091;">
                  VINYLFLIX
                </span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Verify Your Email Address</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #cbd5e1;">
                Hello <strong style="color: #ffffff;">${username}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #94a3b8;">
                Welcome to Vinylflix. To finalize your account setup and unlock your video reward earnings, please use the 6-digit verification code below:
              </p>

              <!-- OTP Code Display Card -->
              <div style="margin: 28px 0; padding: 24px 16px; background: #020617; border-radius: 16px; border: 1px solid #334155; text-align: center;">
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #ff0091; display: block; margin-bottom: 8px;">
                  Your Verification Code
                </span>
                <div style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 20px rgba(255, 0, 145, 0.4);">
                  ${code}
                </div>
                <span style="font-size: 12px; color: #64748b; display: block; margin-top: 10px;">
                  Valid for 15 minutes • Do not share this code with anyone
                </span>
              </div>

              <!-- Security Notice -->
              <div style="margin-top: 24px; padding: 14px 16px; background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.2); border-radius: 12px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #fda4af;">
                  <strong>Security Alert:</strong> If you did not create an account on Vinylflix, please disregard this email. Your email address cannot be registered without this code.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; background: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                © ${new Date().getFullYear()} Vinylflix Platform Inc. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                Automated security transmission from noreply@vinylflix.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    try {
      if (!config.email.pass) {
        logger.info(`📧 [DEV EMAIL SIMULATION] Code for ${toEmail}: ${code}`);
        return true;
      }

      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: config.email.from,
        to: toEmail,
        subject,
        html,
        text: `Your Vinylflix verification code is: ${code}. It expires in 15 minutes.`,
      });

      logger.info(`✅ Verification email sent successfully to ${toEmail}`);
      return true;
    } catch (error: any) {
      logger.error(`❌ Failed to send verification email to ${toEmail}: ${error.message}`);
      logger.info(`📧 [FALLBACK CODE] Code for ${toEmail}: ${code}`);
      return false;
    }
  }
}
