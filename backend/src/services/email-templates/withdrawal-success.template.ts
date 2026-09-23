import { renderEmailBaseLayout } from './base-layout.js';

export interface WithdrawalSuccessEmailData {
  username: string;
  netAmount: number;
  currency?: string;
  bankName: string;
  accountNumberMasked: string;
  reference: string;
  processedAt?: string;
  appUrl?: string;
}

export function renderWithdrawalSuccessEmail(data: WithdrawalSuccessEmailData): { subject: string; html: string } {
  const {
    username,
    netAmount,
    currency = 'NGN',
    bankName,
    accountNumberMasked,
    reference,
    processedAt = new Date().toLocaleString(),
    appUrl = 'https://app.vinylflix.com',
  } = data;

  const symbol = currency === 'USD' ? '$' : '₦';
  const subject = `Payout Sent! ${symbol}${netAmount.toLocaleString()} has been transferred to your bank`;

  const contentHtml = `
    <!-- Celebration Hero Banner with SVG -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 18px;">
      <tr>
        <td style="padding: 24px 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #10b981; box-shadow: 0 0 24px rgba(16, 185, 129, 0.5); text-align: center; display: inline-block; margin-bottom: 12px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 10px auto;">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 900; color: #ffffff;">
            Funds Successfully Transferred!
          </h2>
          <div style="font-size: 32px; font-weight: 900; color: #34d399; letter-spacing: -0.5px; margin-top: 6px;">
            ${symbol}${netAmount.toLocaleString()}
          </div>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #e2e8f0;">
      Hello <strong style="color: #ffffff;">${username}</strong>,
    </p>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #94a3b8;">
      Great news! Your withdrawal has been finalized and the funds have been dispatched to your designated bank account.
    </p>

    <!-- Official Payout Receipt -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0; background: #020617; border: 1px solid #1e293b; border-radius: 18px; overflow: hidden;">
      
      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Settlement Status
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 800; color: #10b981; border-bottom: 1px solid #1e293b;">
          COMPLETED / DISPATCHED
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Bank & Account
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 700; color: #ffffff; border-bottom: 1px solid #1e293b;">
          ${bankName} (${accountNumberMasked})
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Transaction Reference
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 12px; font-family: monospace; font-weight: 600; color: #cbd5e1; border-bottom: 1px solid #1e293b;">
          ${reference}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8;">
          Settled At
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 12px; font-weight: 600; color: #94a3b8;">
          ${processedAt}
        </td>
      </tr>

    </table>

    <!-- Referral / Next Earning Upsell Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px; background: linear-gradient(135deg, rgba(255, 0, 145, 0.1) 0%, rgba(121, 40, 202, 0.1) 100%); border: 1px solid rgba(255, 0, 145, 0.3); border-radius: 16px;">
      <tr>
        <td style="padding: 18px 20px;">
          <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 800; color: #ffffff;">
            Ready for your next cash payout?
          </h4>
          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #cbd5e1;">
            Keep watching your daily video quota or invite colleagues to unlock even faster payouts and referral bonuses.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailBaseLayout({
    title: 'Payout Completed',
    previewText: `Congratulations! ${symbol}${netAmount.toLocaleString()} has been sent to your bank account.`,
    badgeText: 'Payout Settled',
    badgeColor: 'emerald',
    contentHtml,
    ctaText: 'View Wallet Statement',
    ctaUrl: `${appUrl}/wallet`,
    secondaryCtaText: 'Watch More Videos',
    secondaryCtaUrl: `${appUrl}/feed`,
  });

  return { subject, html };
}
