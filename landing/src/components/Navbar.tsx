'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { VinylflixLogo } from './VinylflixLogo';
import { Menu, X, Play, Sparkles, Film, Crown, Smartphone } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0017]/95 backdrop-blur-2xl border-b border-[#2a0054]/80 shadow-2xl shadow-[#FF0091]/5 py-3'
          : 'bg-gradient-to-b from-[#0a0017]/90 via-[#0a0017]/60 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0 flex-shrink-0 min-w-max">
          <div className="relative w-10 h-10 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-[#FF0091]/30 blur-lg rounded-full" />
            <VinylflixLogo className="w-10 h-10 shrink-0 relative z-10 drop-shadow-[0_0_15px_rgba(255,0,145,0.6)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-pink-100 to-[#FF0091] bg-clip-text text-transparent select-none">
              Vinylflix
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-7">
          <a
            href="#catalog"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Film className="w-4 h-4 text-pink-400" /> Catalog
          </a>
          <a
            href="#vip"
            className="text-sm font-semibold text-slate-300 hover:text-amber-300 transition-colors flex items-center gap-1.5"
          >
            <Crown className="w-4 h-4 text-amber-400" /> VIP Passes
          </a>
          <a
            href="#devices"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Smartphone className="w-4 h-4 text-purple-400" /> Apps & TV
          </a>
          <a
            href="#creators"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Filmmakers & Creators
          </a>
          <a
            href="#rewards"
            className="text-sm font-semibold text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            Partner Rewards
          </a>
          <a
            href="#faq"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            FAQ
          </a>
        </div>

        {/* CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://app.vinylflix.com/login"
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-200 hover:text-white hover:bg-white/5 border border-[#2a0054] transition-all"
          >
            Sign In
          </a>
          <a
            href="https://app.vinylflix.com/register"
            className="px-6 py-2.5 rounded-full text-xs font-black text-white bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] hover:opacity-95 shadow-lg shadow-[#FF0091]/30 hover:shadow-[#FF0091]/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Start Streaming
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          className="lg:hidden p-2.5 rounded-xl text-slate-200 hover:text-white bg-[#120029] border border-[#2a0054] transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0d001e]/98 backdrop-blur-2xl border-b border-[#2a0054] px-6 py-6 space-y-4 animate-in slide-in-from-top-4 shadow-2xl">
          <div className="flex flex-col space-y-2">
            <a
              href="#catalog"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-200 hover:text-[#FF0091] py-2 flex items-center gap-2.5"
            >
              <Film className="w-4 h-4 text-pink-400" /> Browse Cinema Catalog
            </a>
            <a
              href="#vip"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-200 hover:text-amber-400 py-2 flex items-center gap-2.5"
            >
              <Crown className="w-4 h-4 text-amber-400" /> VIP OTT Memberships
            </a>
            <a
              href="#devices"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-200 hover:text-purple-400 py-2 flex items-center gap-2.5"
            >
              <Smartphone className="w-4 h-4 text-purple-400" /> Mobile Apps & Smart TV
            </a>
            <a
              href="#creators"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-200 hover:text-white py-2"
            >
              For Filmmakers & Creators
            </a>
            <a
              href="#rewards"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-200 hover:text-emerald-400 py-2"
            >
              Referral & Affiliate Rewards
            </a>
            <a
              href="#faq"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-200 hover:text-white py-2"
            >
              Frequently Asked Questions
            </a>
          </div>

          <div className="pt-4 border-t border-[#2a0054] flex flex-col gap-3">
            <a
              href="https://app.vinylflix.com/login"
              className="w-full py-3 rounded-xl text-center text-sm font-bold text-slate-200 bg-[#14002e] border border-[#2a0054]"
            >
              Sign In to Your Account
            </a>
            <a
              href="https://app.vinylflix.com/register"
              className="w-full py-3 rounded-xl text-center text-sm font-black text-white bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] shadow-lg shadow-[#FF0091]/30 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Start Streaming Free
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
