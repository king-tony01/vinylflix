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
  Users,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Youtube,
  Layers,
  BarChart3,
  Target,
  Eye,
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does Vinylflix help YouTube creators and channels grow?',
      a: 'Vinylflix provides a high-retention discovery platform that showcases your YouTube videos to real human viewers. By ensuring authentic engagement and minimum watch durations, your content gains the strong retention signals needed to boost discoverability.',
    },
    {
      q: 'How do I launch a video campaign on Vinylflix?',
      a: 'Upgrade to the Creator Plan for a flat ₦15,000/month, navigate to the Campaign Hub, paste your public YouTube video or Shorts link (or connect your channel), and launch your campaign for instant distribution.',
    },
    {
      q: 'Are the viewers and interactions authentic?',
      a: 'Yes, 100%. Vinylflix uses server-side cryptographic watch tracking, session heartbeats, browser fingerprinting, and anti-fraud surveillance to ensure every view originates from real, verified human viewers.',
    },
    {
      q: 'What types of YouTube content can I promote?',
      a: 'You can promote any public YouTube video or YouTube Shorts — including channel introductions, music videos, educational tutorials, product reviews, podcasts, and brand showcases.',
    },
    {
      q: 'How can I track my campaign performance and reach?',
      a: 'Your real-time Creator Dashboard provides granular tracking of views delivered, average retention duration, audience engagement rates, and channel subscriber growth.',
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
            Supercharge Your YouTube Reach with{' '}
            <span className="bg-gradient-to-r from-[#FF0091] via-[#c026d3] to-[#7928CA] bg-clip-text text-transparent">
              Real Viewer Attention
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Vinylflix connects ambitious creators and brands with thousands of active, verified viewers. Launch targeted campaigns, maximize high-retention watch time, and accelerate your channel growth.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="https://app.vinylflix.com/campaigns"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-black text-white bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] shadow-xl shadow-[#FF0091]/30 hover:shadow-[#FF0091]/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5"
            >
              <Zap className="w-5 h-5 fill-current" /> Launch Your Campaign
            </a>
            <a
              href="https://app.vinylflix.com/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-slate-200 hover:text-white bg-[#120029] hover:bg-[#1a003b] border border-[#2a0054] hover:border-[#FF0091]/40 transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5 text-pink-400" /> Explore Discovery Feed
            </a>
          </div>

          {/* Stats Bar */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-[#2a0054]/60 max-w-3xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">100%</div>
              <div className="text-xs text-slate-400 mt-1">Verified Real Viewers</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-pink-400">500K+</div>
              <div className="text-xs text-slate-400 mt-1">Video Views Delivered</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">500+</div>
              <div className="text-xs text-slate-400 mt-1">Active Creator Campaigns</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-pink-400">98%</div>
              <div className="text-xs text-slate-400 mt-1">Average Retention Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION BENTO GRID */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">Engineered for Growth</h2>
          <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Why YouTube Creators Choose Vinylflix
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: High Retention Format */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-[#FF0091]/40 transition-all space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-[#FF0091]">
              <PlaySquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">High-Retention Video Discovery</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Showcase your YouTube content in a modern, distraction-free vertical feed designed to capture full audience focus and maximize watch time.
            </p>
          </div>

          {/* Card 2: Precision Retention Model */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-[#FF0091]/40 transition-all space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Automated High-Retention Model</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Our algorithmic engagement system automatically assigns optimal watch durations based on video length — delivering deep Average View Duration (AVD) without manual budgeting.
            </p>
          </div>

          {/* Card 3: Instant Video Import */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-[#FF0091]/40 transition-all space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-[#FF0091]">
              <Youtube className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Instant YouTube & Shorts Import</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Paste any public YouTube video or Shorts URL. Our system automatically extracts metadata, thumbnails, and duration in seconds.
            </p>
          </div>

          {/* Card 4: Verified Human Traffic */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-[#FF0091]/40 transition-all space-y-4 md:col-span-2 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-[#FF0091]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">100% Authentic Human Viewers & Anti-Bot Shield</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Our proprietary server verification, session heartbeat monitoring, and anomaly risk scoring ensure every view is from a real, active human viewer — zero bots, zero fake traffic.
            </p>
          </div>

          {/* Card 5: Channel Subscriptions */}
          <div className="p-8 rounded-3xl bg-[#120029]/80 border border-[#2a0054] hover:border-[#FF0091]/40 transition-all space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Direct Channel Subscription Links</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Seamless 1-click subscription prompts direct engaged viewers directly to your YouTube channel to build long-term subscribers.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">Seamless Campaign Setup</h2>
          <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">How to Launch a Campaign</p>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Get your YouTube videos in front of an active audience in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-[#120029] border border-[#2a0054] space-y-4 hover:border-[#FF0091]/40 transition-all">
            <div className="text-3xl font-black text-pink-400">01</div>
            <h3 className="text-xl font-bold text-white">Import Your YouTube Video</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Paste your YouTube video or Shorts link into the Campaign Hub. Our platform auto-verifies title, duration, and thumbnail.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#120029] border border-[#2a0054] space-y-4 hover:border-[#FF0091]/40 transition-all">
            <div className="text-3xl font-black text-purple-400">02</div>
            <h3 className="text-xl font-bold text-white">Automated Retention Calibration</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Our system automatically assigns the optimal retention requirement (Shorts: 30s, Standard: 2m, Deep: 4m) to maximize algorithmic discovery — all included with your Creator Plan.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#120029] border border-[#2a0054] space-y-4 hover:border-[#FF0091]/40 transition-all">
            <div className="text-3xl font-black text-pink-400">03</div>
            <h3 className="text-xl font-bold text-white">Reach Engaged Viewers</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your video is delivered across our active discovery network. Track live engagement, completion rates, and new channel subscribers.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CREATOR BENEFITS */}
      <section id="creators" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-[#14002e] to-[#0a0017] border border-[#2a0054] p-8 sm:p-14 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">Built For Creators & Brands</h2>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              A Smarter Way to Promote YouTube Content
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0a0017]/60 border border-[#2a0054]/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-[#FF0091]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Real-Time Performance Analytics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monitor watch duration metrics, viewer completions, and audience retention rates live from your dashboard.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0a0017]/60 border border-[#2a0054]/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Fair Play & Anti-Fraud</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Advanced heartbeat verification ensures you only pay for actual watch time from real humans.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0a0017]/60 border border-[#2a0054]/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-[#FF0091]">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Active Viewer Community</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect with thousands of dedicated video enthusiasts eager to discover new channels and talent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ ACCORDION */}
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

      {/* 6. FINAL CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-3xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl shadow-[#FF0091]/20">
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Ready to Accelerate Your YouTube Growth?
            </h2>
            <p className="text-base sm:text-lg text-pink-100 font-normal">
              Join hundreds of creators and brands amplifying their reach with authentic viewer attention.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://app.vinylflix.com/campaigns"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-[#0a0017] font-black text-base shadow-xl hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Launch Your Campaign <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://app.vinylflix.com/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0a0017]/40 backdrop-blur-md border border-white/30 text-white font-bold text-base hover:bg-[#0a0017]/60 transition-all"
              >
                Create Free Account
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
