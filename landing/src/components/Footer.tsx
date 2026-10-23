import React from 'react';
import Link from 'next/link';
import { VinylflixLogo } from './VinylflixLogo';
import { Shield, Sparkles, Film, Crown, Smartphone, Tv, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05000c] border-t border-[#2a0054]/80 text-slate-400 text-sm relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-t from-[#FF0091]/10 via-[#7928CA]/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 shrink-0 flex-shrink-0">
              <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#FF0091]/30 blur-md rounded-full" />
                <VinylflixLogo className="w-9 h-9 shrink-0 relative z-10 drop-shadow-[0_0_12px_rgba(255,0,145,0.5)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white select-none">
                  Vinylflix
                </span>
                <span className="text-[9px] uppercase tracking-widest font-black text-pink-400 -mt-1 opacity-80">
                  African Cinema & OTT
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The premier streaming home for Nollywood blockbusters, African cinema masterpieces, gripping web series, and viral short entertainment. Stream anytime, on any screen, in stunning 4K Ultra HD.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#120029] border border-[#2a0054] text-[11px] font-semibold text-pink-300">
                <Film className="w-3 h-3 text-[#FF0091]" /> Nollywood Originals
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#120029] border border-[#2a0054] text-[11px] font-semibold text-amber-300">
                <Crown className="w-3 h-3 text-amber-400" /> VIP OTT Pass
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#120029] border border-[#2a0054] text-[11px] font-semibold text-purple-300">
                <Tv className="w-3 h-3 text-purple-400" /> Smart TV Ready
              </span>
            </div>
          </div>

          {/* Cinema & Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Stream & Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#catalog" className="hover:text-white transition-colors">
                  Trending Blockbusters
                </a>
              </li>
              <li>
                <a href="#catalog" className="hover:text-white transition-colors">
                  Nollywood Classics & Hits
                </a>
              </li>
              <li>
                <a href="#catalog" className="hover:text-white transition-colors">
                  Bingeable Series & Drama
                </a>
              </li>
              <li>
                <a href="#catalog" className="hover:text-white transition-colors">
                  High-Voltage Shorts & Reels
                </a>
              </li>
              <li>
                <a href="#vip" className="hover:text-amber-300 transition-colors">
                  VIP OTT Pass (Ad-Free)
                </a>
              </li>
              <li>
                <a href="https://app.vinylflix.com" className="hover:text-pink-400 transition-colors font-semibold">
                  Launch Web Player &rarr;
                </a>
              </li>
            </ul>
          </div>

          {/* Apps & Ecosystem */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Apps & Partners</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#devices" className="hover:text-white transition-colors">
                  Android Mobile App (APK)
                </a>
              </li>
              <li>
                <a href="#devices" className="hover:text-white transition-colors">
                  iOS & iPad Streaming
                </a>
              </li>
              <li>
                <a href="#devices" className="hover:text-white transition-colors">
                  Android TV & Smart TV
                </a>
              </li>
              <li>
                <a href="#creators" className="hover:text-white transition-colors">
                  Filmmaker & Creator Hub
                </a>
              </li>
              <li>
                <a href="#rewards" className="hover:text-emerald-400 transition-colors">
                  Referral Partner Program
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Legal & Support</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@vinylflix.com"
                  className="hover:text-pink-300 text-pink-400 transition-colors font-mono"
                >
                  support@vinylflix.com
                </a>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                Payment processing powered by Paystack. Cinema content served in full compliance with content licensing.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-12 pt-8 border-t border-[#2a0054]/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            © {new Date().getFullYear()} Vinylflix Inc. All rights reserved. Made with{' '}
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-current" /> for cinema lovers.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-slate-300">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="hover:text-slate-300">
              Terms
            </Link>
            <a href="https://app.vinylflix.com/login" className="hover:text-pink-400 font-semibold">
              Member Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
