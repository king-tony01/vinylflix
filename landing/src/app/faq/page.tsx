'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  ChevronDown,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  CreditCard,
  Youtube,
  Clock,
  Layers,
  Mail,
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'campaigns', label: 'Campaigns & Setup' },
    { id: 'viewers', label: 'Viewer Authenticity' },
    { id: 'retention', label: 'Watch Retention' },
    { id: 'billing', label: 'Billing & Payments' },
    { id: 'compliance', label: 'YouTube Safety' },
  ];

  const faqs: FaqItem[] = [
    {
      category: 'campaigns',
      q: 'How do I launch a video campaign on Vinylflix?',
      a: 'Creating a campaign takes less than 2 minutes. Upgrade to the Creator Plan (₦15,000/month), navigate to the Campaign Hub, paste your public YouTube video or Shorts link, and hit submit. Our algorithmic engine automatically assigns optimal retention durations and immediately places your video into discovery rotation.',
    },
    {
      category: 'campaigns',
      q: 'Can I promote YouTube Shorts as well as long-form videos?',
      a: 'Yes! Vinylflix fully supports both vertical YouTube Shorts (9:16) and standard horizontal long-form YouTube videos (16:9). Our video container automatically adapts to match your content aspect ratio.',
    },
    {
      category: 'campaigns',
      q: 'Do I need to give Vinylflix access to my YouTube channel or Google account?',
      a: 'No. Vinylflix requires zero channel passwords, Google OAuth permissions, or API credentials. You only paste the public URL of the YouTube video you wish to promote.',
    },
    {
      category: 'campaigns',
      q: 'Can I pause, edit, or delete my campaign after launching?',
      a: 'Yes. From your Creator Dashboard, you can monitor live analytics, pause active campaigns, or adjust your video list at any time with full flexibility.',
    },
    {
      category: 'viewers',
      q: 'Are the viewers on Vinylflix real human beings?',
      a: 'Yes, 100%. Vinylflix employs continuous server-side cryptographic session heartbeats, browser fingerprinting, and anomaly scoring to strictly enforce real human interaction. Automated scripts, emulators, and headless bots are permanently blocked.',
    },
    {
      category: 'viewers',
      q: 'How does Vinylflix ensure viewers actually watch the video?',
      a: 'Our playback engine monitors viewport visibility, active playback telemetry, and audio focus. If a user switches tabs, minimizes the window, or pauses the video, watch timer progress immediately pauses until the viewer returns.',
    },
    {
      category: 'retention',
      q: 'Why is minimum watch duration important for YouTube growth?',
      a: 'YouTube’s discovery algorithm heavily favors Average View Duration (AVD) and Audience Retention Percentage over vanity clicks. Our automated retention tiers (30s for Shorts, 2m for standard videos, and 4m for deep long-form) ensure your video registers strong retention signals that support organic recommendations.',
    },
    {
      category: 'retention',
      q: 'How do viewers subscribe to my YouTube channel?',
      a: 'While watching your video, an interactive creator card displays your channel branding with a direct 1-click subscription link, making it effortless for engaged viewers to subscribe on YouTube.',
    },
    {
      category: 'billing',
      q: 'How does creator campaign pricing work?',
      a: 'Vinylflix operates on a predictable, flat-rate subscription model of ₦15,000 per month for creators. With the Creator Plan, you enjoy unlimited video campaign creation and verified distribution across our active viewer community with zero per-view micro-deductions.',
    },
    {
      category: 'billing',
      q: 'What payment methods are supported?',
      a: 'All subscription transactions are processed securely via Paystack, supporting major credit/debit cards, bank transfers, and digital wallets with industry-standard encryption.',
    },
    {
      category: 'compliance',
      q: 'Is using Vinylflix safe for my YouTube channel and monetization status?',
      a: 'Yes. Vinylflix utilizes standard, compliant YouTube embedded player iframes in full accordance with YouTube Developer Policies and Terms of Service. Views generated through compliant embedded playback are authentic and safe for channel standing and monetization.',
    },
    {
      category: 'compliance',
      q: 'What types of YouTube content are prohibited from campaigns?',
      a: 'We strictly prohibit videos that violate YouTube Community Guidelines, including explicit adult content, hate speech, copyrighted pirated material, fraudulent schemes, or deceptive promotional content.',
    },
  ];

  const filteredFaqs =
    activeCategory === 'all'
      ? faqs
      : faqs.filter((item) => item.category === activeCategory);

  return (
    <div className="space-y-20 md:space-y-28 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. HERO HEADER */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a0033] border border-[#FF0091]/40 text-pink-300 text-xs font-bold shadow-lg shadow-[#FF0091]/10">
          <HelpCircle className="w-3.5 h-3.5 text-[#FF0091]" />
          <span>Knowledge Base & Support</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Frequently Asked{' '}
          <span className="bg-gradient-to-r from-[#FF0091] via-[#c026d3] to-[#7928CA] bg-clip-text text-transparent">
            Questions
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          Everything you need to know about launching campaigns, viewer verification, retention benchmarks, and channel safety on Vinylflix.
        </p>
      </section>

      {/* 2. CATEGORY SELECTOR */}
      <section className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setOpenIndex(0);
              }}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[#FF0091] to-[#7928CA] text-white shadow-lg shadow-[#FF0091]/30'
                  : 'bg-[#120029] text-slate-400 hover:text-white border border-[#2a0054] hover:border-[#FF0091]/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. ACCORDION LIST */}
      <section className="max-w-4xl mx-auto space-y-4">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-2xl bg-[#120029] border border-[#2a0054] overflow-hidden transition-all hover:border-[#FF0091]/40"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between text-base font-bold text-white gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-pink-400 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-[#2a0054]/50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* 4. STILL HAVE QUESTIONS BOX */}
      <section className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-b from-[#14002e] to-[#0a0017] border border-[#2a0054] p-8 sm:p-12 text-center space-y-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-pink-500/10 flex items-center justify-center text-[#FF0091]">
          <Mail className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Have a question not listed here?</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Our creator support team is ready to assist you with campaign setup, custom agency volume, or technical questions.
          </p>
        </div>
        <div>
          <a
            href="mailto:vinylflix@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#120029] border border-[#2a0054] hover:border-[#FF0091]/50 text-pink-300 hover:text-white text-sm font-bold transition-all"
          >
            Contact Creator Support: <span className="font-mono text-white">vinylflix@gmail.com</span>
          </a>
        </div>
      </section>

      {/* 5. CTA BANNER */}
      <section className="rounded-3xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-[#FF0091]/20">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Supercharge Your Reach?
          </h2>
          <p className="text-sm sm:text-base text-pink-100 font-normal">
            Launch your campaign today and put your YouTube videos in front of real, engaged viewers.
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
