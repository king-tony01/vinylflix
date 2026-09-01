import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — Vinylflix',
  description: 'Understand how Vinylflix collects, protects, and handles your personal and financial information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-400">
          Last Updated: September 1, 2026 • Effective Date: September 1, 2026
        </p>
      </div>

      <div className="space-y-10 text-sm text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3 p-6 rounded-2xl bg-[#120029] border border-[#2a0054]">
          <div className="flex items-center gap-2.5 text-base font-bold text-white">
            <Shield className="w-5 h-5 text-[#FF0091]" />
            <h2>1. Introduction & Overview</h2>
          </div>
          <p>
            Vinylflix (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the Platform&rdquo;) is dedicated to protecting your privacy and personal data. This Privacy Policy governs the collection, storage, processing, and disclosure of information gathered when you access our rewarded video platform, websites, mobile interfaces, and associated services.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
          <p>We collect only the information necessary to provide, secure, and operate our rewarded viewing and payment ecosystem:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Account Information:</strong> Full name, username, email address, phone number, and encrypted authentication credentials.
            </li>
            <li>
              <strong className="text-slate-200">Financial & Payout Information:</strong> Nigerian Uniform Bank Account Number (NUBAN), account holder name, and financial transaction records required for processing bank payouts and membership payments.
            </li>
            <li>
              <strong className="text-slate-200">Viewing & Engagement Data:</strong> Cryptographic watch session identifiers, video playback duration, heartbeat intervals, and referral network records.
            </li>
            <li>
              <strong className="text-slate-200">YouTube Data API Information:</strong> When you connect your YouTube channel, we access channel identifiers, channel titles, and subscriber counts via official Google OAuth2 read-only scopes.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Third-Party Integrations & Services</h2>
          <div className="space-y-3">
            <p>
              <strong className="text-white">Paystack Payment Processing:</strong> Payments, card transactions, and bank withdrawals are processed securely by Paystack in compliance with PCI-DSS standards. We do not store raw credit card numbers or banking PINs on our servers.
            </p>
            <p>
              <strong className="text-white">YouTube API Services:</strong> Vinylflix utilizes the YouTube Data API v3 to verify video metadata and creator channel authentications. By using Vinylflix, you agree to be bound by the{' '}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noreferrer"
                className="text-pink-400 hover:underline"
              >
                YouTube Terms of Service
              </a>{' '}
              and the{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-pink-400 hover:underline"
              >
                Google Privacy Policy
              </a>.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. How We Use Your Information</h2>
          <p>We process your data for the following lawful business purposes:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li>Calculating and crediting server-verified watch rewards to your wallet ledger.</li>
            <li>Disbursing bank withdrawals to your verified Nigerian bank account.</li>
            <li>Detecting, preventing, and mitigating multi-accounting, bots, and fraudulent watch sessions.</li>
            <li>Delivering targeted creator campaigns to active viewers.</li>
            <li>Maintaining immutable audit trails for platform compliance and governance.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Data Retention & Security</h2>
          <p>
            We implement state-of-the-art security safeguards, including TLS/HTTPS encryption in transit, hashed passwords (bcrypt), and role-based access control (RBAC). Financial ledger transactions and audit logs are stored immutably to comply with statutory accounting requirements.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Your Data Rights</h2>
          <p>
            Subject to applicable legal obligations (such as anti-money laundering and tax accounting laws), you have the right to access, rectify, or request the deletion of your personal profile data. Contact support at{' '}
            <span className="text-pink-400 font-mono">support@vinylflix.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
