import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  Youtube,
  Clock,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Tv,
  Smartphone,
  Cpu,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works — Step-by-Step Campaign Guide — Vinylflix',
  description:
    'Learn how Vinylflix delivers authentic viewer attention to your YouTube videos and Shorts in 4 simple, transparent steps.',
};

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Import Any YouTube Video or Shorts',
      description:
        'Simply copy and paste your public YouTube video or Shorts URL into the Vinylflix Campaign Hub. Our platform instantly fetches official video metadata, duration, title, and high-definition thumbnail.',
      features: [
        'Zero Google login or OAuth permissions required',
        'Compatible with both standard YouTube videos and Shorts',
        'Automatic duration & thumbnail validation',
      ],
      icon: Youtube,
      color: 'from-pink-500/20 to-purple-500/20',
      textColor: 'text-[#FF0091]',
    },
    {
      number: '02',
      title: 'Automated High-Retention Calibration',
      description:
        'Our platform automatically determines the ideal watch retention tier based on video duration — maximizing YouTube recommendation signals (AVD) under your flat ₦15,000/month Creator Subscription.',
      features: [
        'Smart retention tiers: Shorts (30s), Standard (2m), Deep (4m)',
        'Flat ₦15,000/month with unlimited campaign launches',
        'Automated distribution across active community viewers',
      ],
      icon: Clock,
      color: 'from-purple-500/20 to-indigo-500/20',
      textColor: 'text-purple-400',
    },
    {
      number: '03',
      title: 'Real-Time Distribution to Active Viewers',
      description:
        'Your video is immediately published to the Vinylflix vertical discovery feed, presenting your content to real human viewers in a distraction-free, full-focus streaming interface.',
      features: [
        '100% real human traffic with anti-bot shields',
        'Full-bleed vertical playback experience',
        'Zero competing sidebar clutter or distracting ads',
      ],
      icon: Tv,
      color: 'from-pink-500/20 to-rose-500/20',
      textColor: 'text-pink-400',
    },
    {
      number: '04',
      title: 'Verified Watch Signals & Channel Growth',
      description:
        'Continuous cryptographic heartbeats verify that viewers stay actively engaged. Viewers are presented with 1-click subscription links to convert into long-term subscribers on your YouTube channel.',
      features: [
        'Server-side verified watch heartbeats',
        'Direct 1-click YouTube channel subscription prompts',
        'Granular analytics on views, completion rates, and retention',
      ],
      icon: TrendingUp,
      color: 'from-purple-500/20 to-pink-500/20',
      textColor: 'text-purple-300',
    },
  ];

  return (
    <div className="space-y-20 md:space-y-28 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. HERO HEADER */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a0033] border border-[#FF0091]/40 text-pink-300 text-xs font-bold shadow-lg shadow-[#FF0091]/10">
          <Sparkles className="w-3.5 h-3.5 text-[#FF0091]" />
          <span>Simple, Transparent, Proven</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
          How Vinylflix Drives{' '}
          <span className="bg-gradient-to-r from-[#FF0091] via-[#c026d3] to-[#7928CA] bg-clip-text text-transparent">
            Real YouTube Views
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          From link import to audience conversion — see how our high-retention discovery ecosystem delivers authentic engagement to your YouTube channel.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://app.vinylflix.com/campaigns"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] shadow-xl shadow-[#FF0091]/25 hover:shadow-[#FF0091]/45 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" /> Create a Campaign
          </a>
          <a
            href="https://app.vinylflix.com/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-200 hover:text-white bg-[#120029] hover:bg-[#1a003b] border border-[#2a0054] hover:border-[#FF0091]/40 transition-all flex items-center justify-center gap-2"
          >
            Explore the Discovery Feed
          </a>
        </div>
      </section>

      {/* 2. STEP-BY-STEP BREAKDOWN */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">The Workflow</h2>
          <p className="text-3xl font-black text-white tracking-tight">4 Steps to Audience Growth</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-[#120029]/90 border border-[#2a0054] hover:border-[#FF0091]/50 transition-all space-y-6 flex flex-col justify-between shadow-xl group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl font-black text-pink-400/80 tracking-wider font-mono">
                      {s.number}
                    </div>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${s.color} border border-white/10 flex items-center justify-center ${s.textColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
                </div>

                <div className="pt-4 border-t border-[#2a0054]/60 space-y-2.5">
                  {s.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#FF0091] flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SUPPORTED FORMATS */}
      <section className="rounded-3xl bg-gradient-to-b from-[#14002e] to-[#0a0017] border border-[#2a0054] p-8 sm:p-14 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">Format Flexibility</h2>
          <p className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Optimized for All YouTube Video Formats
          </p>
          <p className="text-xs sm:text-sm text-slate-400">
            Whether you produce quick viral Shorts or detailed long-form documentaries, Vinylflix provides seamless delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-[#0a0017]/80 border border-[#2a0054]/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">YouTube Shorts Campaigns</h4>
                <p className="text-xs text-slate-400">Vertical 9:16 format</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Native vertical viewports designed specifically for Shorts. Ideal for quick viral reach, teaser promotions, music drops, and high-velocity viewer turnarounds.
            </p>
            <div className="pt-2 text-xs text-pink-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF0091]" /> Quick 15s – 60s engagement bursts
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-[#0a0017]/80 border border-[#2a0054]/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-[#FF0091]">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Long-Form Video Campaigns</h4>
                <p className="text-xs text-slate-400">Horizontal 16:9 format</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Immersive playback framing with crisp audio and controls. Ideal for tutorials, reviews, gaming episodes, podcasts, and deep-dive productions requiring deep watch duration.
            </p>
            <div className="pt-2 text-xs text-pink-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF0091]" /> Extended 60s – 300s high-retention sessions
            </div>
          </div>
        </div>
      </section>

      {/* 4. VERIFICATION PIPELINE */}
      <section className="rounded-3xl bg-[#120029]/80 border border-[#2a0054] p-8 sm:p-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">Quality & Integrity</h2>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            How Views Are Counted and Verified
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-[#0a0017]/60 border border-[#2a0054]/60 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">1. Real-Time Telemetry</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Viewers must keep the video playing in active view. Tab switching or backgrounding pauses progress.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0017]/60 border border-[#2a0054]/60 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">2. Heartbeat Signature</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Encrypted session heartbeats are validated server-side to prevent botting, scripts, and manipulation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0017]/60 border border-[#2a0054]/60 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">3. Verified View Credit</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              View rewards are only credited to community members once the required watch duration is cryptographically verified with zero bot activity.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CTA BANNER */}
      <section className="rounded-3xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-[#FF0091]/20">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Boost Your YouTube Video Reach?
          </h2>
          <p className="text-sm sm:text-base text-pink-100 font-normal">
            Launch unlimited campaigns with our flat ₦15,000/month Creator Plan. No hidden fees, instant channel growth.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.vinylflix.com/campaigns"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-[#0a0017] font-black text-sm shadow-xl hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Launch Campaign <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://app.vinylflix.com/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#0a0017]/40 backdrop-blur-md border border-white/30 text-white font-bold text-sm hover:bg-[#0a0017]/60 transition-all"
            >
              Create Free Account
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
