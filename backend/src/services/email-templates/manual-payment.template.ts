import { renderEmailBaseLayout } from './base-layout.js';

export interface ManualPaymentSubmittedEmailData {
  username: string;
  amount: number;
  currency?: string;
  purpose: string;
  planName?: string;
  senderBankName: string;
  senderAccountName: string;
  reference: string;
  appUrl?: string;
}

export function renderManualPaymentSubmittedEmail(data: ManualPaymentSubmittedEmailData): { subject: string; html: string } {
  const {
    username,
    amount,
    currency = 'NGN',
    planName = 'Membership Upgrade',
    senderBankName,
    senderAccountName,
    reference,
    appUrl = 'https://app.vinylflix.com',
  } = data;

  const symbol = currency === 'USD' ? '$' : '₦';
  const subject = `Payment Received: ${symbol}${amount.toLocaleString()} is under verification`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #e2e8f0;">
      Hello <strong style="color: #ffffff;">${username}</strong>,
    </p>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #94a3b8;">
      Thank you for submitting your direct bank transfer. Our finance verification team has received your proof of payment and is currently verifying the transaction.
    </p>

    <!-- Payment Receipt Table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0; background: #020617; border: 1px solid #1e293b; border-radius: 18px; overflow: hidden;">
      <tr>
        <td colspan="2" style="padding: 16px 20px; background: rgba(255, 0, 145, 0.1); border-bottom: 1px solid #1e293b;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td valign="middle">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #FF0091;">
                  Transfer Submission Details
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

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Selected Item / Plan
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 14px; font-weight: 700; color: #ffffff; border-bottom: 1px solid #1e293b;">
          ${planName}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Amount Paid
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 16px; font-weight: 900; color: #FF0091; border-bottom: 1px solid #1e293b;">
          ${symbol}${amount.toLocaleString()}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Sender Bank
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #cbd5e1; border-bottom: 1px solid #1e293b;">
          ${senderBankName}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8;">
          Sender Account Name
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #cbd5e1;">
          ${senderAccountName}
        </td>
      </tr>
    </table>

    <!-- Info Box -->
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
                  Verification Turnaround
                </span>
                <p style="margin: 2px 0 0 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                  Manual transfers are usually verified within <strong>15 to 45 minutes</strong>. Your account will be automatically updated as soon as approval is complete.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailBaseLayout({
    title: 'Bank Transfer Received',
    previewText: `Your payment of ${symbol}${amount.toLocaleString()} has been received and is pending verification.`,
    badgeText: 'Pending Approval',
    badgeColor: 'amber',
    contentHtml,
    ctaText: 'View Account & Membership',
    ctaUrl: `${appUrl}/memberships`,
  });

  return { subject, html };
}

export interface ManualPaymentApprovedEmailData {
  username: string;
  amount: number;
  currency?: string;
  planName?: string;
  reference: string;
  appUrl?: string;
}

export function renderManualPaymentApprovedEmail(data: ManualPaymentApprovedEmailData): { subject: string; html: string } {
  const {
    username,
    amount,
    currency = 'NGN',
    planName = 'Membership Upgrade',
    reference,
    appUrl = 'https://app.vinylflix.com',
  } = data;

  const symbol = currency === 'USD' ? '$' : '₦';
  const subject = `Payment Approved! Your ${planName} is now active 🎉`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #e2e8f0;">
      Hello <strong style="color: #ffffff;">${username}</strong>,
    </p>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #94a3b8;">
      Great news! Your bank transfer payment of <strong style="color: #10b981;">${symbol}${amount.toLocaleString()}</strong> has been verified and approved. Your <strong style="color: #ffffff;">${planName}</strong> benefits are now activated!
    </p>

    <!-- Success Highlight Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 18px; overflow: hidden;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <span style="display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #10b981; margin-bottom: 6px;">
            Payment Settled & Confirmed
          </span>
          <h2 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff;">
            ${planName} Active
          </h2>
          <p style="margin: 6px 0 0 0; font-size: 12px; font-family: monospace; color: #94a3b8;">
            Transaction Ref: ${reference}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #cbd5e1;">
      You now have immediate access to all plan privileges, higher earning limits, and milestone rewards.
    </p>
  `;

  const html = renderEmailBaseLayout({
    title: 'Payment Confirmed',
    previewText: `Your payment for ${planName} was approved. Enjoy your enhanced privileges!`,
    badgeText: 'Payment Approved',
    badgeColor: 'emerald',
    contentHtml,
    ctaText: 'Go to Dashboard',
    ctaUrl: `${appUrl}/`,
  });

  return { subject, html };
}

export interface ManualPaymentRejectedEmailData {
  username: string;
  amount: number;
  currency?: string;
  planName?: string;
  reference: string;
  reason?: string;
  appUrl?: string;
}

export function renderManualPaymentRejectedEmail(data: ManualPaymentRejectedEmailData): { subject: string; html: string } {
  const {
    username,
    amount,
    currency = 'NGN',
    planName = 'Payment',
    reference,
    reason = 'The payment receipt could not be validated against bank records.',
    appUrl = 'https://app.vinylflix.com',
  } = data;

  const symbol = currency === 'USD' ? '$' : '₦';
  const subject = `Payment Update: Bank transfer ${reference} was not approved`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #e2e8f0;">
      Hello <strong style="color: #ffffff;">${username}</strong>,
    </p>

    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 24px; color: #94a3b8;">
      We reviewed your bank transfer submission of <strong style="color: #ffffff;">${symbol}${amount.toLocaleString()}</strong> (Ref: ${reference}). Unfortunately, our finance team could not verify this transaction.
    </p>

    <!-- Reason Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0; background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 14px;">
      <tr>
        <td style="padding: 16px;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #f43f5e;">
            Reason Provided:
          </span>
          <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; color: #ffffff; line-height: 20px;">
            ${reason}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
      If you believe this is an error or if your transfer was already deducted from your bank account, please reply to this email or re-submit with an official banking receipt screenshot.
    </p>
  `;

  const html = renderEmailBaseLayout({
    title: 'Payment Verification Notice',
    previewText: `Your payment submission ${reference} was not approved. Click to review.`,
    badgeText: 'Payment Declined',
    badgeColor: 'rose',
    contentHtml,
    ctaText: 'View Membership Page',
    ctaUrl: `${appUrl}/memberships`,
  });

  return { subject, html };
}
