import { renderEmailBaseLayout } from './base-layout.js';

export interface WelcomeVerifiedEmailData {
  username: string;
  referralCode: string;
  appUrl?: string;
}

export function renderWelcomeVerifiedEmail(data: WelcomeVerifiedEmailData): { subject: string; html: string } {
  const { username, referralCode, appUrl = 'https://app.vinylflix.com' } = data;
  const subject = `Your Vinylflix account is verified! Here's how to start earning`;

  const contentHtml = `
    <!-- Success Banner -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td valign="middle" style="padding-right: 12px;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #10b981; text-align: center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 5px auto;">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </td>
              <td valign="middle">
                <span style="font-size: 14px; font-weight: 800; color: #34d399;">
                  Email Verification Complete
                </span>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #a7f3d0;">
                  Your Vinylflix wallet and member permissions are fully active.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #e2e8f0;">
      Hello <strong style="color: #ffffff;">${username}</strong>,
    </p>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #94a3b8;">
      You are now ready to start earning cash daily. Here is your 3-step master blueprint to maximize your revenue on Vinylflix:
    </p>

    <!-- 3 Action Blueprint Cards -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
      
      <!-- Step 1: Watch Feed -->
      <tr>
        <td style="padding-bottom: 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #020617; border: 1px solid #1e293b; border-radius: 16px; padding: 16px;">
            <tr>
              <td valign="top" width="36">
                <span style="display: inline-block; width: 28px; height: 28px; border-radius: 8px; background: rgba(255, 0, 145, 0.15); border: 1px solid rgba(255, 0, 145, 0.4); text-align: center; line-height: 28px; font-size: 12px; font-weight: 900; color: #ff0091;">
                  1
                </span>
              </td>
              <td valign="top" style="padding-left: 10px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #ffffff;">
                  Explore The Video Feed
                </h4>
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                  Watch creator videos in your feed. When your watch time completes (30s, 2m, or 4m), your reward is instantly credited to your wallet.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Step 2: Choose Membership -->
      <tr>
        <td style="padding-bottom: 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #020617; border: 1px solid #1e293b; border-radius: 16px; padding: 16px;">
            <tr>
              <td valign="top" width="36">
                <span style="display: inline-block; width: 28px; height: 28px; border-radius: 8px; background: rgba(121, 40, 202, 0.15); border: 1px solid rgba(121, 40, 202, 0.4); text-align: center; line-height: 28px; font-size: 12px; font-weight: 900; color: #c084fc;">
                  2
                </span>
              </td>
              <td valign="top" style="padding-left: 10px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #ffffff;">
                  Upgrade to Basic or Premium
                </h4>
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                  <strong>Basic:</strong> Up to ₦205/day (₦6,150/mo) + ₦10,000 milestone bonus.<br>
                  <strong>Premium:</strong> Up to ₦400/day (₦12,000/mo) + ₦25,000 milestone bonus.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Step 3: Refer & Earn -->
      <tr>
        <td>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #020617; border: 1px solid #1e293b; border-radius: 16px; padding: 16px;">
            <tr>
              <td valign="top" width="36">
                <span style="display: inline-block; width: 28px; height: 28px; border-radius: 8px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); text-align: center; line-height: 28px; font-size: 12px; font-weight: 900; color: #38bdf8;">
                  3
                </span>
              </td>
              <td valign="top" style="padding-left: 10px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #ffffff;">
                  Share Your Referral Code
                </h4>
                <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                  Earn ₦1,000 per referral. Your personal referral code:
                </p>
                <div style="display: inline-block; padding: 4px 12px; background: #0f172a; border: 1px dashed #ff0091; border-radius: 8px; font-family: monospace; font-size: 13px; font-weight: 800; color: #ff0091; letter-spacing: 1.5px;">
                  ${referralCode}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  `;

  const html = renderEmailBaseLayout({
    title: 'Account Verified & Ready',
    previewText: `Welcome to Vinylflix, ${username}! Your account is verified and ready for daily earnings.`,
    badgeText: 'Verified Member',
    badgeColor: 'emerald',
    contentHtml,
    ctaText: 'Start Watching & Earning',
    ctaUrl: `${appUrl}/feed`,
    secondaryCtaText: 'View Memberships',
    secondaryCtaUrl: `${appUrl}/memberships`,
  });

  return { subject, html };
}
