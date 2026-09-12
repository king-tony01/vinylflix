'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { VinylflixLogo } from './VinylflixLogo';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0017]/80 backdrop-blur-xl border-b border-[#2a0054]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <VinylflixLogo className="w-10 h-10 drop-shadow-[0_0_15px_rgba(255,0,145,0.5)]" />
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-pink-100 to-pink-300 bg-clip-text text-transparent">
            Vinylflix
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="#creators" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            For Creators
          </Link>
          <Link href="#faq" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            FAQ
          </Link>
        </div>

        {/* CTA Actions */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://service.vinylflix.com/login"
            className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-900 border border-[#2a0054] transition-all"
          >
            Sign In
          </a>
          <a
            href="https://service.vinylflix.com/register"
            className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#FF0091] to-[#360099] hover:opacity-90 shadow-lg shadow-[#FF0091]/25 hover:shadow-[#FF0091]/40 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Start Earning
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0e001f] border-b border-[#2a0054] px-6 py-6 space-y-4 animate-in slide-in-from-top-4">
          <div className="flex flex-col space-y-3">
            <Link
              href="#features"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-300 hover:text-white py-2"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-300 hover:text-white py-2"
            >
              How It Works
            </Link>
            <Link
              href="#creators"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-300 hover:text-white py-2"
            >
              For Creators
            </Link>
            <Link
              href="#faq"
              onClick={() => setMobileOpen(false)}
              className="text-base font-semibold text-slate-300 hover:text-white py-2"
            >
              FAQ
            </Link>
          </div>

          <div className="pt-4 border-t border-[#2a0054] flex flex-col gap-3">
            <a
              href="https://service.vinylflix.com/login"
              className="w-full py-3 rounded-xl text-center text-sm font-bold text-slate-200 bg-slate-900 border border-[#2a0054]"
            >
              Sign In
            </a>
            <a
              href="https://service.vinylflix.com/register"
              className="w-full py-3 rounded-xl text-center text-sm font-bold text-white bg-gradient-to-r from-[#FF0091] to-[#360099] shadow-lg shadow-[#FF0091]/30 flex items-center justify-center gap-2"
            >
              Start Earning <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
