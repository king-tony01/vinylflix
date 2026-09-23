import { renderEmailBaseLayout } from './base-layout.js';

export interface SecurityLoginAlertEmailData {
  username: string;
  ipAddress: string;
  userAgent: string;
  deviceType?: string;
  location?: string;
  timestamp?: string;
  resetPasswordUrl?: string;
}

export function renderSecurityLoginAlertEmail(data: SecurityLoginAlertEmailData): { subject: string; html: string } {
  const {
    username,
    ipAddress,
    userAgent,
    deviceType = 'Web Browser',
    location = 'Unknown Location',
    timestamp = new Date().toUTCString(),
    resetPasswordUrl = 'https://app.vinylflix.com/reset-password',
  } = data;

  const subject = `Security Alert: New sign-in to your Vinylflix account`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #e2e8f0;">
      Hello <strong style="color: #ffffff;">${username}</strong>,
    </p>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #94a3b8;">
      We detected a new sign-in to your Vinylflix account from an unrecognized device or IP address. Please review the activity details below:
    </p>

    <!-- Sign-In Activity Details Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0; background: #020617; border: 1px solid #1e293b; border-radius: 18px; overflow: hidden;">
      
      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Date & Time
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 700; color: #ffffff; border-bottom: 1px solid #1e293b;">
          ${timestamp}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          IP Address
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-family: monospace; font-weight: 700; color: #38bdf8; border-bottom: 1px solid #1e293b;">
          ${ipAddress}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Device / Platform
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #cbd5e1; border-bottom: 1px solid #1e293b;">
          ${deviceType}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Client Details
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 11px; font-family: monospace; color: #64748b; max-width: 250px; word-break: break-all; border-bottom: 1px solid #1e293b;">
          ${userAgent.slice(0, 70)}...
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8;">
          Approximate Location
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #cbd5e1;">
          ${location}
        </td>
      </tr>

    </table>

    <!-- Action Choice Notice -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px; background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 14px;">
      <tr>
        <td style="padding: 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td valign="top" width="24" style="padding-right: 12px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </td>
              <td valign="top">
                <p style="margin: 0; font-size: 13px; line-height: 20px; color: #fda4af;">
                  <strong>Didn't recognize this sign-in?</strong> Someone may have access to your credentials. Click below to immediately secure your account, reset your password, and disconnect other active sessions.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailBaseLayout({
    title: 'New Sign-In Detected',
    previewText: `Security Alert: New sign-in detected on your Vinylflix account from ${ipAddress}.`,
    badgeText: 'Security Alert',
    badgeColor: 'rose',
    contentHtml,
    ctaText: 'Secure My Account',
    ctaUrl: resetPasswordUrl,
    secondaryCtaText: 'Review Sessions',
    secondaryCtaUrl: 'https://app.vinylflix.com/wallet',
  });

  return { subject, html };
}
