export interface EmailLayoutOptions {
  title: string;
  previewText?: string;
  badgeText?: string;
  badgeColor?: 'pink' | 'emerald' | 'amber' | 'rose' | 'sky';
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

export function renderEmailBaseLayout(options: EmailLayoutOptions): string {
  const {
    title,
    previewText = 'Important notification from Vinylflix',
    badgeText,
    badgeColor = 'pink',
    contentHtml,
    ctaText,
    ctaUrl,
    secondaryCtaText,
    secondaryCtaUrl,
  } = options;

  // Badge styling
  const badgeStyles: Record<string, { bg: string; text: string; border: string }> = {
    pink: { bg: 'rgba(255, 0, 145, 0.15)', text: '#ff0091', border: 'rgba(255, 0, 145, 0.3)' },
    emerald: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    amber: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    rose: { bg: 'rgba(244, 63, 94, 0.15)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' },
    sky: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
  };

  const activeBadge = badgeStyles[badgeColor] || badgeStyles.pink;

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: dark;
      supported-color-schemes: dark;
    }
    body {
      margin: 0;
      padding: 0;
      word-spacing: normal;
      background-color: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table, td, div, a {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
      }
      .mobile-padding {
        padding: 24px 20px !important;
      }
      .mobile-header-padding {
        padding: 28px 20px 20px 20px !important;
      }
      .mobile-cta {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        margin-bottom: 12px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #090d16; color: #f8fafc;">
  <!-- Hidden Preheader Preview Text -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${previewText}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #090d16; min-height: 100vh; padding: 30px 12px;">
    <tr>
      <td align="center" valign="top">
        <!-- Main Container -->
        <table class="email-container" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background: #0f172a; border-radius: 24px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);">
          
          <!-- Top Header Section with SVG Logo -->
          <tr>
            <td class="mobile-header-padding" style="padding: 36px 36px 24px 36px; text-align: center; background: linear-gradient(180deg, rgba(255, 0, 145, 0.12) 0%, rgba(121, 40, 202, 0.08) 50%, rgba(15, 23, 42, 0) 100%); border-bottom: 1px solid #1e293b;">
              
              <!-- Inline SVG Vinylflix Official Logo -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td align="center" valign="middle">
                    <a href="https://vinylflix.com" target="_blank" style="display: inline-block; text-decoration: none;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <!-- SVG Stylized Vinyl Record Icon -->
                          <td valign="middle" style="padding-right: 12px;">
                            <div style="width: 44px; height: 44px; border-radius: 50%; background: #020617; border: 2px solid #334155; display: inline-block; text-align: center; box-shadow: 0 0 20px rgba(255, 0, 145, 0.35);">
                              <svg width="40" height="40" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 2px auto;">
                                <circle cx="22" cy="22" r="19" stroke="#1e293b" stroke-width="2"/>
                                <circle cx="22" cy="22" r="15" stroke="#334155" stroke-width="1.5" stroke-dasharray="2 2"/>
                                <circle cx="22" cy="22" r="11" stroke="#475569" stroke-width="1.5"/>
                                <circle cx="22" cy="22" r="7" fill="url(#vf_logo_grad)"/>
                                <circle cx="22" cy="22" r="2.5" fill="#ffffff"/>
                                <defs>
                                  <linearGradient id="vf_logo_grad" x1="15" y1="15" x2="29" y2="29" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FF0091"/>
                                    <stop offset="0.5" stop-color="#7928CA"/>
                                    <stop offset="1" stop-color="#38BDF8"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                            </div>
                          </td>
                          <!-- Logo Text -->
                          <td valign="middle">
                            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                              VINYL<span style="color: #ff0091;">FLIX</span>
                            </span>
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>
              </table>

              ${
                badgeText
                  ? `
              <!-- Status / Category Badge -->
              <div style="display: inline-block; margin-top: 6px; padding: 5px 14px; border-radius: 20px; background-color: ${activeBadge.bg}; border: 1px solid ${activeBadge.border};">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: ${activeBadge.text};">
                  ${badgeText}
                </span>
              </div>
              `
                  : ''
              }

              <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 32px;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td class="mobile-padding" style="padding: 36px 36px 28px 36px; background-color: #0f172a;">
              ${contentHtml}

              ${
                ctaText && ctaUrl
                  ? `
              <!-- Call to Action Buttons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 14px; background: linear-gradient(135deg, #FF0091 0%, #7928CA 50%, #360099 100%); box-shadow: 0 10px 25px -5px rgba(255, 0, 145, 0.4);">
                          <a href="${ctaUrl}" target="_blank" class="mobile-cta" style="display: inline-block; padding: 15px 36px; font-size: 14px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 14px; letter-spacing: 0.3px;">
                            ${ctaText} →
                          </a>
                        </td>
                        ${
                          secondaryCtaText && secondaryCtaUrl
                            ? `
                        <td align="center" style="padding-left: 12px;">
                          <a href="${secondaryCtaUrl}" target="_blank" class="mobile-cta" style="display: inline-block; padding: 14px 24px; font-size: 13px; font-weight: 700; color: #cbd5e1; text-decoration: none; border-radius: 14px; background: #1e293b; border: 1px solid #334155;">
                            ${secondaryCtaText}
                          </a>
                        </td>
                        `
                            : ''
                        }
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td class="mobile-padding" style="padding: 28px 36px 36px 36px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              
              <!-- Security & Assurance Badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td valign="middle" style="padding-right: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                  </td>
                  <td valign="middle">
                    <span style="font-size: 12px; font-weight: 600; color: #64748b;">
                      Encrypted & Authenticated Transactional Communication
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; font-size: 12px; line-height: 18px; color: #64748b;">
                You are receiving this automated email because you hold an account on the Vinylflix video earnings network.
              </p>

              <p style="margin: 0 0 16px 0; font-size: 11px; line-height: 16px; color: #475569;">
                Vinylflix Inc. • Lagos & Global Ecosystem • Support: support@vinylflix.com
              </p>

              <p style="margin: 0; font-size: 11px; color: #334155;">
                © ${new Date().getFullYear()} Vinylflix. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
