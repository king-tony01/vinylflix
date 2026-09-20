import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  ShieldCheck,
  BarChart3,
  Youtube,
  Target,
  ArrowRight,
  CheckCircle2,
  Tv,
  Gamepad2,
  Music,
  GraduationCap,
  Mic,
  Briefcase,
  PlaySquare,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'For YouTube Creators & Channels — Vinylflix',
  description:
    'Accelerate channel subscribers, maximize video retention metrics, and scale your YouTube audience with verified human discovery campaigns.',
};

export default function CreatorsPage() {
  const niches = [
    {
      icon: Gamepad2,
      title: 'Gaming & Tech',
      desc: 'Showcase highlights, reviews, and gameplay to an engaged, gaming-literate audience.',
    },
    {
      icon: Music,
      title: 'Music & Visual Artists',
      desc: 'Promote music videos, lyric clips, and beat showcases with guaranteed minimum listening time.',
    },
    {
      icon: GraduationCap,
      title: 'Educational & Tutorials',
      desc: 'Reach learners seeking deep explanations, coding guides, finance lessons, and how-tos.',
    },
    {
      icon: Mic,
      title: 'Podcasts & Interviews',
      desc: 'Drive attention to full podcast episodes or clip highlights to expand subscriber bases.',
    },
    {
      icon: Briefcase,
      title: 'Brands & Businesses',
      desc: 'Showcase product launches, customer testimonials, and brand narratives with full analytics.',
    },
    {
      icon: PlaySquare,
      title: 'Shorts & Vlogs',
      desc: 'Turn viral short-form clips into dedicated channel subscribers with high-retention discovery.',
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Stronger Algorithm Retention Signals',
      description:
        'YouTube prioritizes Average View Duration (AVD) and completion rate above all else. By ensuring viewers watch for your custom required duration, your videos build the retention metrics that trigger organic discovery.',
      highlight: 'Targeted minimum watch time (up to 300s)',
    },
    {
      icon: Users,
      title: 'Turn Viewers into Lifelong Subscribers',
      description:
        'Our discovery feed integrates direct 1-click subscription buttons linked to your YouTube channel. When viewers love what they see, subscribing is effortless.',
      highlight: 'Seamless channel subscription integration',
    },
    {
      icon: Target,
      title: 'Pay Only for Verified Human Engagement',
      description:
        'Traditional advertising charges you for accidental impressions and 2-second scroll-bys. With Vinylflix, your budget is only deducted when a verified human completes your required watch time.',
      highlight: 'Transparent pay-per-qualified-view pricing',
    },
    {
      icon: BarChart3,
      title: 'Granular Real-Time Dashboard',
      description:
        'Manage all your YouTube video campaigns from one central creator hub. Monitor view counts, remaining budget, average retention, and pause or adjust campaigns at any time.',
      highlight: 'Full creator dashboard control & analytics',
    },
  ];

  return (
    <div className="space-y-20 md:space-y-28 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. HERO HEADER */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a0033] border border-[#FF0091]/40 text-pink-300 text-xs font-bold shadow-lg shadow-[#FF0091]/10">
          <Sparkles className="w-3.5 h-3.5 text-[#FF0091]" />
          <span>Built Exclusively for YouTube Creators</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Break Through the Algorithm Plateau with{' '}
          <span className="bg-gradient-to-r from-[#FF0091] via-[#c026d3] to-[#7928CA] bg-clip-text text-transparent">
            Verified Retention
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          Stop struggling against saturated feeds. Vinylflix puts your videos directly in front of thousands of active viewers who genuinely watch and subscribe.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://app.vinylflix.com/campaigns"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] shadow-xl shadow-[#FF0091]/25 hover:shadow-[#FF0091]/45 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" /> Launch Creator Campaign
          </a>
          <a
            href="https://app.vinylflix.com/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-200 hover:text-white bg-[#120029] hover:bg-[#1a003b] border border-[#2a0054] hover:border-[#FF0091]/40 transition-all flex items-center justify-center gap-2"
          >
            Sign Up Free
          </a>
        </div>
      </section>

      {/* 2. CORE CREATOR BENEFITS */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">The Creator Edge</h2>
          <p className="text-3xl font-black text-white tracking-tight">Why Smart Channels Scale on Vinylflix</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-[#120029]/90 border border-[#2a0054] hover:border-[#FF0091]/50 transition-all space-y-6 flex flex-col justify-between shadow-xl group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF0091]/20 to-[#360099]/20 border border-[#FF0091]/30 flex items-center justify-center text-[#FF0091] group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{b.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{b.description}</p>
                </div>

                <div className="pt-4 border-t border-[#2a0054]/60">
                  <div className="flex items-center gap-2 text-xs text-pink-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#FF0091] flex-shrink-0" />
                    <span>{b.highlight}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. NICHES COVERAGE */}
      <section className="rounded-3xl bg-gradient-to-b from-[#14002e] to-[#0a0017] border border-[#2a0054] p-8 sm:p-14 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#FF0091]">Tailored Across All Content</h2>
          <p className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Ideal for Every Content Genre
          </p>
          <p className="text-xs sm:text-sm text-slate-400">
            From emerging vloggers to established digital production agencies, Vinylflix powers growth across all YouTube categories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {niches.map((n, idx) => {
            const Icon = n.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#0a0017]/80 border border-[#2a0054]/80 space-y-3 hover:border-[#FF0091]/40 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-[#FF0091]">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">{n.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{n.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. COMPLIANCE & SAFETY ASSURANCE */}
      <section className="rounded-3xl bg-[#120029]/80 border border-[#2a0054] p-8 sm:p-12 space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-[#FF0091] flex-shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white">100% YouTube Compliant & Safe</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Vinylflix delivers video plays exclusively through official standard YouTube embedded player iframes in strict adherence to YouTube Developer Terms of Service. Views count toward authentic channel watch time without risking channel standing or monetization eligibility.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CTA BANNER */}
      <section className="rounded-3xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-[#FF0091]/20">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Give Your Channel the Reach It Deserves?
          </h2>
          <p className="text-sm sm:text-base text-pink-100 font-normal">
            Launch a campaign with any budget and watch your YouTube analytics soar.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.vinylflix.com/campaigns"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-[#0a0017] font-black text-sm shadow-xl hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Launch Your Campaign <ArrowRight className="w-4 h-4" />
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
