import { renderEmailBaseLayout } from './base-layout.js';

export interface WithdrawalRequestedEmailData {
  username: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency?: string;
  bankName: string;
  accountNumberMasked: string;
  accountName: string;
  reference: string;
  appUrl?: string;
}

export function renderWithdrawalRequestedEmail(data: WithdrawalRequestedEmailData): { subject: string; html: string } {
  const {
    username,
    amount,
    fee,
    netAmount,
    currency = 'NGN',
    bankName,
    accountNumberMasked,
    accountName,
    reference,
    appUrl = 'https://app.vinylflix.com',
  } = data;

  const symbol = currency === 'USD' ? '$' : '₦';
  const subject = `Withdrawal Requested: ${symbol}${netAmount.toLocaleString()} is processing`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #e2e8f0;">
      Hello <strong style="color: #ffffff;">${username}</strong>,
    </p>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #94a3b8;">
      We have received your withdrawal request. Your payout is currently being processed by our automated treasury engine.
    </p>

    <!-- Withdrawal Receipt Itemized Table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0; background: #020617; border: 1px solid #1e293b; border-radius: 18px; overflow: hidden;">
      
      <!-- Receipt Header Banner -->
      <tr>
        <td colspan="2" style="padding: 16px 20px; background: rgba(245, 158, 11, 0.1); border-bottom: 1px solid #1e293b;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td valign="middle">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #f59e0b;">
                  Payout Summary
                </span>
              </td>
              <td align="right" valign="middle">
                <span style="font-size: 11px; font-family: monospace; color: #94a3b8;">
                  Ref: ${reference}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Receipt Rows -->
      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Requested Amount
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 14px; font-weight: 700; color: #ffffff; border-bottom: 1px solid #1e293b;">
          ${symbol}${amount.toLocaleString()}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Processing Fee
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 14px; font-weight: 600; color: #f43f5e; border-bottom: 1px solid #1e293b;">
          -${symbol}${fee.toLocaleString()}
        </td>
      </tr>

      <tr>
        <td style="padding: 16px 20px; font-size: 14px; font-weight: 800; color: #ffffff; background: rgba(15, 23, 42, 0.6); border-bottom: 1px solid #1e293b;">
          Net Payout (To Receive)
        </td>
        <td align="right" style="padding: 16px 20px; font-size: 18px; font-weight: 900; color: #10b981; background: rgba(15, 23, 42, 0.6); border-bottom: 1px solid #1e293b;">
          ${symbol}${netAmount.toLocaleString()}
        </td>
      </tr>

      <!-- Bank Details -->
      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Destination Bank
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 700; color: #ffffff; border-bottom: 1px solid #1e293b;">
          ${bankName}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8;">
          Account Name & Number
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #cbd5e1;">
          ${accountName} (${accountNumberMasked})
        </td>
      </tr>

    </table>

    <!-- ETA Timeline Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 14px;">
      <tr>
        <td style="padding: 14px 18px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td valign="top" width="22" style="padding-right: 10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </td>
              <td valign="top">
                <span style="font-size: 13px; font-weight: 700; color: #38bdf8;">
                  Estimated Arrival Time
                </span>
                <p style="margin: 2px 0 0 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                  Standard bank transfers are settled between <strong>15 minutes to 24 hours</strong> depending on interbank clearing networks.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #64748b;">
      If you did not initiate this withdrawal, please contact our risk team immediately at <strong style="color: #f43f5e;">security@vinylflix.com</strong>.
    </p>
  `;

  const html = renderEmailBaseLayout({
    title: 'Withdrawal In Progress',
    previewText: `Your withdrawal of ${symbol}${netAmount.toLocaleString()} has been received and is processing.`,
    badgeText: 'Processing Payout',
    badgeColor: 'amber',
    contentHtml,
    ctaText: 'View Wallet & History',
    ctaUrl: `${appUrl}/wallet`,
  });

  return { subject, html };
}
