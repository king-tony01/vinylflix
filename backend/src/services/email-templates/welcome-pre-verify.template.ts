import { renderEmailBaseLayout } from './base-layout.js';

export interface WelcomePreVerifyEmailData {
  username: string;
  code: string;
  appUrl?: string;
}

export function renderWelcomePreVerifyEmail(data: WelcomePreVerifyEmailData): { subject: string; html: string } {
  const { username, code, appUrl = 'https://app.vinylflix.com' } = data;
  const subject = `Welcome to Vinylflix, ${username}! Complete your activation`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #e2e8f0;">
      Welcome to the revolution, <strong style="color: #ffffff;">${username}</strong>! 🎉
    </p>

    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #94a3b8;">
      You’ve just unlocked access to Vinylflix—the high-yield rewarded video ecosystem where your screen time turns directly into cash earnings and YouTube creators receive genuine human watch retention.
    </p>

    <!-- 3 Quick Value Highlights -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background: #020617; border-radius: 18px; border: 1px solid #1e293b; overflow: hidden;">
      <tr>
        <td style="padding: 20px;">
          
          <!-- Item 1: Rewarded Viewing -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
            <tr>
              <td valign="top" width="36">
                <div style="width: 32px; height: 32px; border-radius: 10px; background: rgba(255, 0, 145, 0.15); border: 1px solid rgba(255, 0, 145, 0.3); text-align: center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff0091" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 6px auto;">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
              </td>
              <td valign="top" style="padding-left: 12px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #ffffff;">Watch & Earn Instant Cash</h4>
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                  Earn verified monetary rewards on Shorts (₦10), Highlights (₦25), and Deep Engagement videos (₦50).
                </p>
              </td>
            </tr>
          </table>

          <!-- Item 2: Direct Bank Withdrawals -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
            <tr>
              <td valign="top" width="36">
                <div style="width: 32px; height: 32px; border-radius: 10px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); text-align: center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 6px auto;">
                    <rect width="20" height="14" x="2" y="5" rx="2"/>
                    <line x1="2" x2="22" y1="10" y2="10"/>
                  </svg>
                </div>
              </td>
              <td valign="top" style="padding-left: 12px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #ffffff;">Fast Bank Payouts</h4>
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                  Transfer your earnings directly to your bank account anytime you hit your tier threshold.
                </p>
              </td>
            </tr>
          </table>

          <!-- Item 3: Creator Growth -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td valign="top" width="36">
                <div style="width: 32px; height: 32px; border-radius: 10px; background: rgba(121, 40, 202, 0.15); border: 1px solid rgba(121, 40, 202, 0.3); text-align: center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 6px auto;">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                </div>
              </td>
              <td valign="top" style="padding-left: 12px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #ffffff;">Referral Milestones & Creator Boost</h4>
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                  Unlock ₦10,000 to ₦25,000 milestone cash bonuses and ₦1,000 per referral.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>

    <!-- Verification Step -->
    <div style="margin: 28px 0; padding: 22px; background: linear-gradient(135deg, rgba(255, 0, 145, 0.1) 0%, rgba(121, 40, 202, 0.1) 100%); border-radius: 18px; border: 1px solid rgba(255, 0, 145, 0.3); text-align: center;">
      <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #ff0091; margin-bottom: 8px;">
        Step 1: Verify Your Email
      </span>
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #cbd5e1;">
        Enter this 6-digit code on the activation screen to activate your wallet:
      </p>
      <div style="font-family: 'SF Mono', Consolas, Menlo, monospace; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 16px rgba(255, 0, 145, 0.5);">
        ${code}
      </div>
      <span style="display: block; margin-top: 10px; font-size: 11px; color: #94a3b8;">
        Valid for 15 minutes
      </span>
    </div>
  `;

  const html = renderEmailBaseLayout({
    title: 'Welcome to Vinylflix',
    previewText: `Welcome to Vinylflix, ${username}! Complete your activation with code ${code}`,
    badgeText: 'New Account',
    badgeColor: 'sky',
    contentHtml,
    ctaText: 'Activate My Account',
    ctaUrl: `${appUrl}/verify-email?code=${code}`,
  });

  return { subject, html };
}
