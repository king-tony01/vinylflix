import { renderEmailBaseLayout } from './base-layout.js';

export interface OtpVerificationEmailData {
  username: string;
  code: string;
  verificationUrl?: string;
  supportEmail?: string;
}

export function renderOtpVerificationEmail(data: OtpVerificationEmailData): { subject: string; html: string } {
  const { username, code, verificationUrl = 'https://app.vinylflix.com/verify-email' } = data;
  const subject = `${code} is your Vinylflix verification code`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #e2e8f0;">
      Hello <strong style="color: #ffffff;">${username}</strong>,
    </p>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #94a3b8;">
      Thank you for joining Vinylflix. To finalize your registration, secure your profile, and start earning cash rewards from watching verified creator videos, please use the 6-digit code below:
    </p>

    <!-- OTP Code Display Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0; background: #020617; border-radius: 18px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.5);">
      <tr>
        <td align="center" style="padding: 28px 20px;">
          <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #ff0091; margin-bottom: 12px;">
            Your One-Time Passcode
          </span>
          <div style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #ffffff; text-shadow: 0 0 24px rgba(255, 0, 145, 0.45); padding-left: 12px;">
            ${code}
          </div>
          
          <!-- Countdown Badge with SVG Clock -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top: 14px;">
            <tr>
              <td valign="middle" style="padding-right: 6px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </td>
              <td valign="middle">
                <span style="font-size: 12px; font-weight: 600; color: #f59e0b;">
                  Expires in 15 minutes
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 20px; color: #64748b; text-align: center;">
      You can also click the button below to automatically load your verification page:
    </p>

    <!-- Security Warning Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px; background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 14px;">
      <tr>
        <td style="padding: 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td valign="top" width="24" style="padding-right: 12px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </td>
              <td valign="top">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #fda4af;">
                  <strong>Security Reminder:</strong> Never share this 6-digit code with anyone. Vinylflix staff will never ask for your verification code or password.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailBaseLayout({
    title: 'Verify Your Email Address',
    previewText: `${code} is your Vinylflix verification code. Complete your setup now.`,
    badgeText: 'Action Required',
    badgeColor: 'pink',
    contentHtml,
    ctaText: 'Enter Verification Code',
    ctaUrl: `${verificationUrl}?email=${encodeURIComponent(data.username || '')}&code=${code}`,
  });

  return { subject, html };
}
