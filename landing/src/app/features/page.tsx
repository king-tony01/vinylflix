import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PlaySquare,
  ShieldCheck,
  Zap,
  TrendingUp,
  Youtube,
  Layers,
  BarChart3,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  MousePointerClick,
  Sliders,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Features — Vinylflix',
  description:
    'Explore the high-retention video discovery, anti-bot verification, precision targeting, and YouTube growth features engineered by Vinylflix.',
};

export default function FeaturesPage() {
  const featureList = [
    {
      icon: PlaySquare,
      title: 'High-Retention Video Discovery Feed',
      description:
        'Deliver your long-form YouTube videos and Shorts in a clean, vertical TikTok-style streaming environment. Designed specifically to hold viewer attention without algorithmic clutter or competitor distractions.',
      highlights: [
        'Dedicated full-bleed playback container',
        'Optimized for mobile, tablet & desktop',
        'Distraction-free viewer immersion',
      ],
    },
    {
      icon: Target,
      title: 'Automated High-Retention Model',
      description:
        'Engineered for organic algorithm distribution. Videos are automatically assigned optimal watch tiers based on video duration — from 30s for Shorts up to 4 minutes for deep long-form videos.',
      highlights: [
        'Shorts (< 90s): 30s minimum watch time',
        'Standard (1.5m – 5m): 2m high-retention tier',
        'Long-form (5m+): 4m deep-watch tier',
      ],
    },
    {
      icon: ShieldCheck,
      title: '100% Real Human Viewers & Anti-Bot Shield',
      description:
        'Our proprietary server-side validation framework monitors continuous cryptographic session heartbeats, browser fingerprints, and anomaly patterns to ensure zero bot traffic.',
      highlights: [
        'Cryptographic session heartbeats',
        'Device fingerprint & IP risk scoring',
        'Zero synthetic or automated bot views',
      ],
    },
    {
      icon: Youtube,
      title: 'Instant YouTube & Shorts Import',
      description:
        'No complicated API credentials or channel logins needed. Simply paste any public YouTube video or Shorts link into the Campaign Hub for instant metadata, thumbnail, and duration extraction.',
      highlights: [
        'Supports standard YouTube videos & Shorts',
        'Instant metadata & duration resolution',
        'Zero Google OAuth friction or review gates',
      ],
    },
    {
      icon: TrendingUp,
      title: '1-Click Direct Channel Subscriptions',
      description:
        'Every campaign video features prominent, non-intrusive creator branding and 1-click subscription buttons that seamlessly guide engaged viewers directly to your YouTube channel.',
      highlights: [
        'Direct YouTube subscription link integration',
        'Creator handle & custom branding display',
        'Long-term audience acquisition',
      ],
    },
    {
      icon: BarChart3,
      title: 'Real-Time Campaign Performance Analytics',
      description:
        'Access granular reporting on your campaign’s performance as it happens. Monitor views delivered, average watch duration, subscriber conversions, and completion rates live.',
      highlights: [
        'Live views and session metrics',
        'Audience reach & subscriber conversion tracking',
        'Audience retention & completion insights',
      ],
    },
  ];

  return (
    <div className="space-y-20 md:space-y-28 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. HERO HEADER */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a0033] border border-[#FF0091]/40 text-pink-300 text-xs font-bold shadow-lg shadow-[#FF0091]/10">
          <Sparkles className="w-3.5 h-3.5 text-[#FF0091]" />
          <span>Engineered For Maximum Retention</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Powerful Features to Accelerate Your{' '}
          <span className="bg-gradient-to-r from-[#FF0091] via-[#c026d3] to-[#7928CA] bg-clip-text text-transparent">
            YouTube Growth
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          Explore the technology and campaign infrastructure that connects ambitious YouTube creators with an active, verified human audience.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://app.vinylflix.com/campaigns"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] shadow-xl shadow-[#FF0091]/25 hover:shadow-[#FF0091]/45 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" /> Launch Campaign
          </a>
          <a
            href="https://app.vinylflix.com/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-200 hover:text-white bg-[#120029] hover:bg-[#1a003b] border border-[#2a0054] hover:border-[#FF0091]/40 transition-all flex items-center justify-center gap-2"
          >
            Create Free Account
          </a>
        </div>
      </section>

      {/* 2. MAIN FEATURES GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featureList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-[#120029]/90 border border-[#2a0054] hover:border-[#FF0091]/50 transition-all space-y-5 flex flex-col justify-between group shadow-xl"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF0091]/20 to-[#360099]/20 border border-[#FF0091]/30 flex items-center justify-center text-[#FF0091] group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-4 border-t border-[#2a0054]/60 space-y-2">
                {item.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF0091] flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* 3. TECHNICAL ARCHITECTURE SHOWCASE */}
      <section className="rounded-3xl bg-gradient-to-b from-[#14002e] to-[#0a0017] border border-[#2a0054] p-8 sm:p-14 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">Enterprise-Grade Verification</h2>
          <p className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            How Vinylflix Protects Your Ad Spend
          </p>
          <p className="text-xs sm:text-sm text-slate-400">
            Unlike traditional social ads that charge for accidental scroll-bys, Vinylflix enforces strict engagement benchmarks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0a0017]/70 border border-[#2a0054]/80 space-y-3">
            <div className="flex items-center gap-2 text-pink-400 text-sm font-bold">
              <Cpu className="w-4 h-4" /> Cryptographic Timers
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Watch sessions are signed and validated with server-side timestamps. Client-side clock manipulation is strictly rejected.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0017]/70 border border-[#2a0054]/80 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 text-sm font-bold">
              <ShieldCheck className="w-4 h-4" /> Continuous Heartbeats
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Periodic telemetry pings confirm that the video is actively in viewport and playing at normal playback speeds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0017]/70 border border-[#2a0054]/80 space-y-3">
            <div className="flex items-center gap-2 text-pink-400 text-sm font-bold">
              <Sliders className="w-4 h-4" /> Fair Distribution Engine
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Views are credited atomically on qualified completion, ensuring systematic, fair rotation across our entire viewer community.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CTA BANNER */}
      <section className="rounded-3xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-[#FF0091]/20">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Start Promoting Your Videos Today
          </h2>
          <p className="text-sm sm:text-base text-pink-100 font-normal">
            Take control of your YouTube audience growth with targeted campaigns and verified human viewers.
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
