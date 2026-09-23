import { renderEmailBaseLayout } from './base-layout.js';

export type AccountStatusAction = 'SUSPENDED' | 'BANNED' | 'RESTRICTED' | 'WARNING' | 'RESTORED';

export interface AccountStatusEmailData {
  username: string;
  action: AccountStatusAction;
  reason?: string;
  effectiveDate?: string;
  appealUrl?: string;
  supportEmail?: string;
}

export function renderAccountStatusEmail(data: AccountStatusEmailData): { subject: string; html: string } {
  const {
    username,
    action,
    reason = 'Violation of Vinylflix Platform Terms of Service & Anti-Fraud Guidelines',
    effectiveDate = new Date().toLocaleDateString(),
    appealUrl = 'https://app.vinylflix.com/support/appeal',
    supportEmail = 'support@vinylflix.com',
  } = data;

  const actionConfigs: Record<
    AccountStatusAction,
    {
      title: string;
      badgeText: string;
      badgeColor: 'rose' | 'amber' | 'emerald';
      iconColor: string;
      headline: string;
      description: string;
      subject: string;
      ctaText: string;
    }
  > = {
    SUSPENDED: {
      title: 'Account Suspension Notice',
      badgeText: 'Account Suspended',
      badgeColor: 'rose',
      iconColor: '#f43f5e',
      headline: 'Your Vinylflix account has been suspended',
      description:
        'Following an automated fraud risk audit, your account privileges, rewarded viewing, and withdrawal channels have been temporarily suspended.',
      subject: `Important: Your Vinylflix account has been suspended`,
      ctaText: 'Submit Account Appeal',
    },
    BANNED: {
      title: 'Permanent Account Termination',
      badgeText: 'Account Banned',
      badgeColor: 'rose',
      iconColor: '#ef4444',
      headline: 'Your account has been permanently terminated',
      description:
        'Severe violations of our ecosystem guidelines (such as bot automation, fraudulent referrals, or multiple account abuse) have resulted in permanent termination.',
      subject: `Notice: Permanent termination of your Vinylflix account`,
      ctaText: 'Contact Compliance',
    },
    RESTRICTED: {
      title: 'Account Privileges Restricted',
      badgeText: 'Temporary Restriction',
      badgeColor: 'amber',
      iconColor: '#f59e0b',
      headline: 'Temporary restrictions applied to your account',
      description:
        'Certain features on your account (such as instant withdrawals or campaign creation) have been placed on hold pending manual security verification.',
      subject: `Account Notice: Temporary restriction on your Vinylflix account`,
      ctaText: 'Verify Identity & Appeal',
    },
    WARNING: {
      title: 'Policy Compliance Warning',
      badgeText: 'Security Notice',
      badgeColor: 'amber',
      iconColor: '#f59e0b',
      headline: 'Unusual activity detected on your account',
      description:
        'Our anti-cheat systems flagged irregular video playback patterns. Please ensure you are watching videos in full active view without proxy or automation tools.',
      subject: `Compliance Notice: Irregular activity detected on your Vinylflix account`,
      ctaText: 'Review Guidelines',
    },
    RESTORED: {
      title: 'Account Privileges Restored',
      badgeText: 'Account Active',
      badgeColor: 'emerald',
      iconColor: '#10b981',
      headline: 'Your Vinylflix account is fully restored',
      description:
        'Our security team has reviewed your appeal and cleared your account. All video earning quotas and withdrawal permissions are active again.',
      subject: `Good News: Your Vinylflix account privileges have been restored`,
      ctaText: 'Access Your Dashboard',
    },
  };

  const current = actionConfigs[action] || actionConfigs.WARNING;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #e2e8f0;">
      Hello <strong style="color: #ffffff;">${username}</strong>,
    </p>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #94a3b8;">
      ${current.description}
    </p>

    <!-- Details Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0; background: #020617; border: 1px solid #1e293b; border-radius: 18px; overflow: hidden;">
      
      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Account Status
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 800; color: ${current.iconColor}; border-bottom: 1px solid #1e293b;">
          ${action}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1e293b;">
          Primary Reason
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #ffffff; border-bottom: 1px solid #1e293b;">
          ${reason}
        </td>
      </tr>

      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #94a3b8;">
          Effective Date
        </td>
        <td align="right" style="padding: 14px 20px; font-size: 13px; font-weight: 600; color: #94a3b8;">
          ${effectiveDate}
        </td>
      </tr>

    </table>

    ${
      action !== 'RESTORED'
        ? `
    <!-- Appeal Information Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px; background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 14px;">
      <tr>
        <td style="padding: 16px 20px;">
          <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #ffffff;">
            Can I appeal this decision?
          </h4>
          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
            If you believe this action was taken in error, you may submit an official appeal with supporting information. Our Trust & Safety team reviews all submissions within 48 business hours.
          </p>
        </td>
      </tr>
    </table>
    `
        : ''
    }

    <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 18px; color: #64748b;">
      For inquiries regarding platform integrity and policies, please reach our compliance desk directly at <strong style="color: #cbd5e1;">${supportEmail}</strong>.
    </p>
  `;

  const html = renderEmailBaseLayout({
    title: current.title,
    previewText: `${current.headline} — Vinylflix Security & Trust`,
    badgeText: current.badgeText,
    badgeColor: current.badgeColor,
    contentHtml,
    ctaText: current.ctaText,
    ctaUrl: appealUrl,
  });

  return { subject: current.subject, html };
}
