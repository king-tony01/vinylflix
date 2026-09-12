import React from 'react';
import Link from 'next/link';
import { VinylflixLogo } from './VinylflixLogo';
import { Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#070010] border-t border-[#2a0054]/80 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <VinylflixLogo className="w-8 h-8 drop-shadow-[0_0_12px_rgba(255,0,145,0.4)]" />
              <span className="text-xl font-black tracking-tight text-white">Vinylflix</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              The premier content attention and rewarded video streaming ecosystem. Connecting passionate viewers with ambitious creators and brands worldwide.
            </p>
            <div className="flex items-center gap-2 text-xs text-pink-400 font-semibold">
              <Shield className="w-4 h-4 text-[#FF0091]" />
              <span>Bank-Grade Payout Security</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://service.vinylflix.com/" className="hover:text-white transition-colors">
                  Watch & Earn Feed
                </a>
              </li>
              <li>
                <a href="https://service.vinylflix.com/memberships" className="hover:text-white transition-colors">
                  Membership Plans
                </a>
              </li>
              <li>
                <a href="https://service.vinylflix.com/referrals" className="hover:text-white transition-colors">
                  Refer & Earn Network
                </a>
              </li>
              <li>
                <a href="https://service.vinylflix.com/campaigns" className="hover:text-white transition-colors">
                  Creator Campaign Hub
                </a>
              </li>
              <li>
                <a href="https://service.vinylflix.com/wallet" className="hover:text-white transition-colors">
                  Wallet & Direct Payouts
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Legal & Policies</h4>
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
                <a href="mailto:vinylflix@gmail.com" className="hover:text-pink-300 text-pink-400 transition-colors font-mono">
                  vinylflix@gmail.com
                </a>
              </li>
              <li>
                <span className="text-slate-500">YouTube Terms Compliance</span>
              </li>
            </ul>
          </div>

          {/* Connect & Payments */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Partners & Security</h4>
            <p className="text-xs text-slate-400">
              Payments, bank account verification, and automated payouts are securely powered by Paystack. Video delivery conforms to official Google YouTube Data API standards.
            </p>
            <div className="pt-2">
              <a
                href="https://service.vinylflix.com/register"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF0091] hover:text-pink-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Join Vinylflix Today &rarr;
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#2a0054]/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Vinylflix. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-slate-300">Privacy</Link>
            <Link href="/terms-of-service" className="hover:text-slate-300">Terms</Link>
            <a href="https://service.vinylflix.com" className="hover:text-slate-300">Launch App</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
