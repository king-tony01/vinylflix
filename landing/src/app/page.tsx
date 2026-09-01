'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { VinylflixLogo } from '../components/VinylflixLogo';
import {
  Play,
  PlaySquare,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  Wallet,
  Users,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Youtube,
  Layers,
  Lock,
  Award,
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'viewers' | 'creators'>('viewers');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I earn cash rewards on Vinylflix?',
      a: 'After creating your account and activating a membership, browse the Watch Feed. As you watch verified creator campaigns, our server cryptographically tracks your watch time and credits rewards directly into your wallet.',
    },
    {
      q: 'How do withdrawals to my bank account work?',
      a: 'Withdrawals are direct and seamless. When you request a payout from your Wallet, your Nigerian bank account is validated in real-time using NUBAN resolution, and funds are disbursed directly to your bank account via Paystack.',
    },
    {
      q: 'What are Locked Milestone Rewards?',
      a: 'When you activate a paid membership, you receive a locked bonus credit (e.g. ₦10,000 for Basic members). Once you refer the required number of qualified members to the platform, the full locked amount automatically unlocks into your withdrawable available balance.',
    },
    {
      q: 'How does Vinylflix help YouTube creators and advertisers?',
      a: 'Vinylflix connects your YouTube videos to real, verified human viewers. Creators can connect their channel via official Google OAuth, set their reward budget, and receive authentic, high-retention views that boost channel metrics.',
    },
    {
      q: 'Is there an anti-cheat and anti-fraud system?',
      a: 'Yes. Vinylflix uses server-side cryptographic watch sessions, heartbeat frequency validation, anomaly risk scoring, and continuous anti-bot surveillance to ensure creators only pay for real, authentic human attention.',
    },
  ];

  return (
    <div className="space-y-24 md:space-y-32 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#FF0091]/25 via-[#7928CA]/20 to-[#360099]/25 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Turn Video Attention Into{' '}
            <span className="bg-gradient-to-r from-[#FF0091] via-[#c026d3] to-[#7928CA] bg-clip-text text-transparent">
              Real Cash Rewards
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Watch engaging videos, earn guaranteed rewards, and cash out directly to your bank account. Ambitious YouTube creators get authentic, high-retention views that drive growth.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="https://vinylflix.onrender.com/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-black text-white bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] shadow-xl shadow-[#FF0091]/30 hover:shadow-[#FF0091]/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5"
            >
              <Zap className="w-5 h-5 fill-current" /> Start Earning Today
            </a>
            <a
              href="https://vinylflix.onrender.com/campaigns"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-slate-200 hover:text-white bg-[#120029] hover:bg-[#1a003b] border border-[#2a0054] hover:border-[#FF0091]/40 transition-all flex items-center justify-center gap-2"
            >
              <Youtube className="w-5 h-5 text-red-400" /> Promote Your Videos
            </a>
          </div>

          {/* Stats Bar */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-[#2a0054]/60 max-w-3xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">₦10M+</div>
              <div className="text-xs text-slate-400 mt-1">Rewards Disbursed</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-pink-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Verified Real Views</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">&lt; 15 mins</div>
              <div className="text-xs text-slate-400 mt-1">Average Payout Time</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-pink-400">500+</div>
              <div className="text-xs text-slate-400 mt-1">Active Video Campaigns</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION BENTO GRID */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">Engineered for Fair Play</h2>
          <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Why Creators & Viewers Choose Vinylflix
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Rewarded Viewing */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-[#FF0091]/40 transition-all space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-[#FF0091]">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <h3 className="text-xl font-bold text-white">Cryptographic Rewarded Video</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time watch duration tracking with continuous heartbeat verification. Earn cash directly for your time and undivided attention.
            </p>
          </div>

          {/* Card 2: Double Entry Ledger */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-[#FF0091]/40 transition-all space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Double-Entry Financial Ledger</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every kobo earned is strictly recorded on an immutable accounting ledger. Transparent multi-bucket wallet for available, locked, and pending balances.
            </p>
          </div>

          {/* Card 3: Instant Bank Payouts */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-[#FF0091]/40 transition-all space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-[#FF0091]">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Instant NUBAN Bank Payouts</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Validate your account holder name before withdrawal and receive automated payouts directly to any Nigerian commercial or fintech bank via Paystack.
            </p>
          </div>

          {/* Card 4: Milestone Rewards */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-[#FF0091]/40 transition-all space-y-4 md:col-span-2 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-[#FF0091]">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">₦10,000+ Conditional Milestone Bonuses</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Paid members receive locked milestone bonus credits. Grow your referral network with active members to automatically unlock and disburse the bonus directly into your withdrawable wallet.
            </p>
          </div>

          {/* Card 5: Official YouTube Integration */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-[#FF0091]/40 transition-all space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Youtube className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Official YouTube API v3</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connect official YouTube creator channels using Google OAuth to import videos instantly and track viewer retention metrics.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (DUAL AUDIENCE) */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">Simple 3-Step Process</h2>
          <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">How Vinylflix Works</p>
          
          {/* Toggle Tab */}
          <div className="inline-flex p-1.5 rounded-2xl bg-[#120029] border border-[#2a0054] mt-6">
            <button
              onClick={() => setActiveTab('viewers')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'viewers'
                  ? 'bg-gradient-to-r from-[#FF0091] to-[#360099] text-white shadow-md shadow-[#FF0091]/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              For Viewers & Earners
            </button>
            <button
              onClick={() => setActiveTab('creators')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'creators'
                  ? 'bg-gradient-to-r from-[#FF0091] to-[#360099] text-white shadow-md shadow-[#FF0091]/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              For Creators & Brands
            </button>
          </div>
        </div>

        {activeTab === 'viewers' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#120029] border border-[#2a0054] space-y-4">
              <div className="text-3xl font-black text-pink-400">01</div>
              <h3 className="text-xl font-bold text-white">Create Account & Choose Plan</h3>
              <p className="text-sm text-slate-400">
                Register in 30 seconds. Choose a membership plan to unlock earning multiplier rates and a ₦10,000 locked milestone bonus.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-[#120029] border border-[#2a0054] space-y-4">
              <div className="text-3xl font-black text-pink-400">02</div>
              <h3 className="text-xl font-bold text-white">Watch Campaign Videos</h3>
              <p className="text-sm text-slate-400">
                Scroll through the TikTok-style video feed. Each qualified video watched accumulates cash directly into your real-time wallet.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-[#120029] border border-[#2a0054] space-y-4">
              <div className="text-3xl font-black text-pink-400">03</div>
              <h3 className="text-xl font-bold text-white">Withdraw to Bank Account</h3>
              <p className="text-sm text-slate-400">
                Enter your account number and select your bank. Verify your account name and receive your cash payout via Paystack.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#120029] border border-[#2a0054] space-y-4">
              <div className="text-3xl font-black text-purple-400">01</div>
              <h3 className="text-xl font-bold text-white">Connect YouTube Channel</h3>
              <p className="text-sm text-slate-400">
                Authorize your channel with Google OAuth or paste any public YouTube video link for immediate import.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-[#120029] border border-[#2a0054] space-y-4">
              <div className="text-3xl font-black text-purple-400">02</div>
              <h3 className="text-xl font-bold text-white">Set Target Views & Budget</h3>
              <p className="text-sm text-slate-400">
                Define the minimum required watch duration and set your target view count. Pay securely via card or bank transfer.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-[#120029] border border-[#2a0054] space-y-4">
              <div className="text-3xl font-black text-purple-400">03</div>
              <h3 className="text-xl font-bold text-white">Gain High-Retention Audience</h3>
              <p className="text-sm text-slate-400">
                Your video is distributed across thousands of engaged viewers. Track conversions, completion rate, and channel subscribers.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 4. FAQ ACCORDION */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">Got Questions?</h2>
          <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">Frequently Asked Questions</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl bg-[#120029] border border-[#2a0054] overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between text-base font-bold text-white gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-pink-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === index && (
                <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-[#2a0054]/50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5. FINAL CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-3xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl shadow-[#FF0091]/20">
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Ready to Monetize Your Video Attention?
            </h2>
            <p className="text-base sm:text-lg text-pink-100 font-normal">
              Join thousands of viewers earning daily cash rewards and creators accelerating their YouTube reach.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://vinylflix.onrender.com/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-[#0a0017] font-black text-base shadow-xl hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Create Free Account <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://vinylflix.onrender.com/memberships"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0a0017]/40 backdrop-blur-md border border-white/30 text-white font-bold text-base hover:bg-[#0a0017]/60 transition-all"
              >
                Explore Membership Tiers
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
