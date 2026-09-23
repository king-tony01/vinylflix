import { describe, it, expect } from 'vitest';
import {
  renderOtpVerificationEmail,
  renderWelcomePreVerifyEmail,
  renderWelcomeVerifiedEmail,
  renderWithdrawalRequestedEmail,
  renderWithdrawalSuccessEmail,
  renderSecurityLoginAlertEmail,
  renderAccountStatusEmail,
  type AccountStatusAction,
} from '../src/services/email-templates/index.js';
import { EmailService } from '../src/services/email.service.js';

describe('Email Templates & Service - Vinylflix Responsive Marketing Suite', () => {
  it('1. should render OTP verification email with inline SVGs and 6-digit code', () => {
    const { subject, html } = renderOtpVerificationEmail({
      username: 'alex_creator',
      code: '849201',
      verificationUrl: 'https://app.vinylflix.com/verify-email',
    });

    expect(subject).toContain('849201');
    expect(html).toContain('849201');
    expect(html).toContain('alex_creator');
    expect(html).toContain('<svg'); // Inline SVG verified
    expect(html).toContain('Expires in 15 minutes');
    expect(html).toContain('VINYL');
  });

  it('2. should render Welcome Pre-Verification email with 3 value highlights', () => {
    const { subject, html } = renderWelcomePreVerifyEmail({
      username: 'sarah_growth',
      code: '371940',
      appUrl: 'https://app.vinylflix.com',
    });

    expect(subject).toContain('Welcome to Vinylflix, sarah_growth!');
    expect(html).toContain('Watch & Earn Instant Cash');
    expect(html).toContain('Fast Bank Payouts');
    expect(html).toContain('371940');
    expect(html).toContain('<svg');
  });

  it('3. should render Welcome Verified onboarding email with referral code and 3-step guide', () => {
    const { subject, html } = renderWelcomeVerifiedEmail({
      username: 'john_earner',
      referralCode: 'GOLD777',
      appUrl: 'https://app.vinylflix.com',
    });

    expect(subject).toContain('Your Vinylflix account is verified!');
    expect(html).toContain('Email Verification Complete');
    expect(html).toContain('Explore The Video Feed');
    expect(html).toContain('Upgrade to Basic or Premium');
    expect(html).toContain('GOLD777');
    expect(html).toContain('<svg');
  });

  it('4. should render Withdrawal Requested receipt with itemized breakdown and fee', () => {
    const { subject, html } = renderWithdrawalRequestedEmail({
      username: 'mark_payout',
      amount: 25000,
      fee: 1250,
      netAmount: 23750,
      currency: 'NGN',
      bankName: 'Guaranty Trust Bank (GTBank)',
      accountNumberMasked: '••••••••1234',
      accountName: 'Mark Doe',
      reference: 'wdraw_8492019384729102',
    });

    expect(subject).toContain('23,750');
    expect(html).toContain('₦25,000');
    expect(html).toContain('-₦1,250');
    expect(html).toContain('₦23,750');
    expect(html).toContain('Guaranty Trust Bank (GTBank)');
    expect(html).toContain('wdraw_8492019384729102');
  });

  it('5. should render Withdrawal Success celebration email with green checkmark', () => {
    const { subject, html } = renderWithdrawalSuccessEmail({
      username: 'lisa_cash',
      netAmount: 50000,
      currency: 'NGN',
      bankName: 'Access Bank',
      accountNumberMasked: '••••••••5678',
      reference: 'wdraw_succ_99482019',
      processedAt: 'September 23, 2026, 11:30 AM',
    });

    expect(subject).toContain('₦50,000');
    expect(html).toContain('Funds Successfully Transferred!');
    expect(html).toContain('₦50,000');
    expect(html).toContain('Access Bank');
    expect(html).toContain('wdraw_succ_99482019');
    expect(html).toContain('<svg');
  });

  it('6. should render Security Login Alert email with IP and client details', () => {
    const { subject, html } = renderSecurityLoginAlertEmail({
      username: 'security_user',
      ipAddress: '102.89.34.120',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      deviceType: 'Safari on iPhone',
      location: 'Lagos, Nigeria',
      timestamp: 'Wed, 23 Sep 2026 11:00:00 GMT',
    });

    expect(subject).toContain('Security Alert');
    expect(html).toContain('102.89.34.120');
    expect(html).toContain('Safari on iPhone');
    expect(html).toContain('Lagos, Nigeria');
    expect(html).toContain('Secure My Account');
  });

  it('7. should render Account Moderation emails across all status types', () => {
    const actions: AccountStatusAction[] = ['SUSPENDED', 'BANNED', 'RESTRICTED', 'WARNING', 'RESTORED'];

    for (const action of actions) {
      const { subject, html } = renderAccountStatusEmail({
        username: 'user_target',
        action,
        reason: 'Automated viewing violation',
        effectiveDate: '2026-09-23',
      });

      expect(subject).toBeDefined();
      expect(html).toContain('user_target');
      expect(html).toContain(action);
      expect(html).toContain('<svg');
    }
  });

  it('8. should execute all EmailService dispatch methods safely in dev/simulation mode', async () => {
    const r1 = await EmailService.sendVerificationEmail('test@example.com', 'user1', '123456');
    const r2 = await EmailService.sendWelcomePreVerifyEmail('test@example.com', 'user1', '123456');
    const r3 = await EmailService.sendWelcomeVerifiedEmail('test@example.com', 'user1', 'CODE123');
    const r4 = await EmailService.sendWithdrawalRequestedEmail('test@example.com', 'user1', {
      amount: 10000,
      fee: 500,
      netAmount: 9500,
      bankName: 'Zenith Bank',
      accountNumberMasked: '••••1234',
      accountName: 'User One',
      reference: 'ref_123',
    });
    const r5 = await EmailService.sendWithdrawalSuccessEmail('test@example.com', 'user1', {
      netAmount: 9500,
      bankName: 'Zenith Bank',
      accountNumberMasked: '••••1234',
      reference: 'ref_123',
    });
    const r6 = await EmailService.sendLoginAlertEmail('test@example.com', 'user1', {
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome on Mac',
    });
    const r7 = await EmailService.sendAccountStatusAlertEmail('test@example.com', 'user1', {
      action: 'SUSPENDED',
      reason: 'Testing',
    });

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(r3).toBe(true);
    expect(r4).toBe(true);
    expect(r5).toBe(true);
    expect(r6).toBe(true);
    expect(r7).toBe(true);
  });
});
