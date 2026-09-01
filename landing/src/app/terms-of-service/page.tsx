import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — Vinylflix',
  description: 'Review the legal terms, rewarded viewing rules, and policies governing use of the Vinylflix platform.',
};

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-400">
          Last Updated: September 1, 2026 • Effective Date: September 1, 2026
        </p>
      </div>

      <div className="space-y-10 text-sm text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3 p-6 rounded-2xl bg-[#120029] border border-[#2a0054]">
          <div className="flex items-center gap-2.5 text-base font-bold text-white">
            <Scale className="w-5 h-5 text-[#FF0091]" />
            <h2>1. Agreement to Terms</h2>
          </div>
          <p>
            By registering an account, accessing, or using Vinylflix, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Platform.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Eligibility & Account Registration</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>You must be at least 18 years old or possess legal parental consent to create an account and receive cash payouts.</li>
            <li>Each user is strictly limited to <strong>one active account</strong>. Operating multiple accounts, automated bot viewers, emulators, or synthetic identity accounts is strictly prohibited and results in permanent suspension and forfeiture of balances.</li>
            <li>You are responsible for safeguarding your login credentials.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Rewarded Viewing & Server Verification</h2>
          <p>
            Watch rewards are calculated, verified, and issued strictly by Vinylflix backend systems. Key terms include:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>Clients and web browsers cannot dictate reward values. Rewards are only issued upon successful cryptographic heartbeat verification of continuous playback.</li>
            <li>Fast-forwarding, tab-switching manipulation, headless automation, or scripted viewing will fail verification and may trigger anti-fraud penalties.</li>
            <li>Rewards are credited to the user&apos;s available wallet balance based on active campaign budget availability.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Memberships & Locked Milestone Rewards</h2>
          <div className="space-y-2 text-slate-400">
            <p>
              Paid memberships grant higher earning rates and access to creator campaign creation tools. All membership fees are final and non-refundable once activated.
            </p>
            <p>
              <strong>Conditional Milestone Rewards (e.g. ₦10,000 credit):</strong> Locked rewards are issued as conditional credits that are only unlocked to the user&apos;s withdrawable balance when the specified number of genuine, qualified referrals is achieved. Self-referrals or synthetic accounts are void.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Withdrawals & Payouts</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>Withdrawal requests are subject to minimum balance thresholds (e.g. ₦2,000).</li>
            <li>Payouts are made directly to verified Nigerian bank accounts matching the user&apos;s registered identity.</li>
            <li>The Platform reserves the right to review high-risk or flagged withdrawal requests for anti-money laundering and fair play compliance before disbursement.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Creator Campaigns & Content Standards</h2>
          <p>
            Creators promoting YouTube videos warrant that their content does not contain unlawful, infringing, hateful, sexually explicit, or fraudulent material. We reserve the right to reject or pause any campaign violating community guidelines.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Limitation of Liability & Governing Law</h2>
          <p>
            Vinylflix is provided on an &ldquo;as is&rdquo; basis. These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
          </p>
        </section>
      </div>
    </div>
  );
}
