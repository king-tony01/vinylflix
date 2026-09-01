import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { VinylflixLogo } from './VinylflixLogo.js';
import {
  PlaySquare,
  Crown,
  Users,
  Layers,
  Wallet as WalletIcon,
  LogOut,
  Lock,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isFeed = location.pathname === '/';

  const navItems = [
    { label: 'Watch Feed', path: '/', icon: PlaySquare },
    { label: 'Memberships', path: '/memberships', icon: Crown },
    { label: 'Refer & Earn', path: '/referrals', icon: Users },
    { label: 'Campaigns', path: '/campaigns', icon: Layers },
    { label: 'Wallet', path: '/wallet', icon: WalletIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`w-full bg-slate-950 text-slate-100 flex flex-col md:flex-row ${
        isFeed
          ? 'fixed inset-0 h-full w-full overflow-hidden md:relative md:h-screen'
          : 'min-h-screen'
      }`}
    >
      {/* 1. DESKTOP / TABLET FIXED SIDEBAR (hidden on mobile) */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 bg-slate-900/95 border-r border-slate-800/80 p-5 z-40 backdrop-blur-2xl flex-shrink-0 h-screen select-none">
        <div className="space-y-8">
          {/* Vinylflix Official Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-all">
              <VinylflixLogo className="w-10 h-10 drop-shadow-[0_0_16px_rgba(255,0,145,0.45)]" />
            </div>
            <div>
              <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-pink-100 to-pink-300 bg-clip-text text-transparent">
                Vinylflix
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#FF0091]/20 via-[#7928CA]/15 to-[#360099]/15 text-pink-300 border border-[#FF0091]/40 shadow-lg shadow-[#FF0091]/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-[#FF0091]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User Wallet & Profile */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          {user ? (
            <>
              {/* Wallet Summary Card */}
              <Link
                to="/wallet"
                className="block p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-[#FF0091]/40 transition-colors group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <WalletIcon className="w-3.5 h-3.5 text-[#FF0091]" /> Available
                  </span>
                  <span className="text-[#FF0091] font-bold text-sm">
                    ₦{(user.wallet?.availableBalance || 0).toLocaleString()}
                  </span>
                </div>

                {(user.wallet?.lockedBalance || 0) > 0 && (
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400/90 pt-1.5 border-t border-slate-900">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" /> Locked Bonus
                    </span>
                    <span className="font-bold text-amber-300">
                      ₦{(user.wallet?.lockedBalance || 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </Link>

              {/* User Profile & Logout */}
              <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-950/40 border border-slate-800/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF0091] to-[#360099] flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-md shadow-[#FF0091]/20">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.username}</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-1.5 py-0.2 rounded border border-pink-500/20">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                className="block w-full py-2.5 text-center text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="block w-full py-2.5 text-center text-xs font-bold text-white bg-gradient-to-r from-[#FF0091] to-[#360099] hover:opacity-90 rounded-xl shadow-lg shadow-[#FF0091]/25 transition-all"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MOBILE TOP COMPACT BAR (hidden on desktop/tablet) */}
      <header
        className={`md:hidden flex items-center justify-between px-4 h-14 z-40 transition-all ${
          isFeed
            ? 'absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none'
            : 'sticky top-0 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl pointer-events-auto'
        }`}
      >
        <Link to="/" className="flex items-center gap-2 pointer-events-auto">
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
            <VinylflixLogo className="w-8 h-8 flex-shrink-0 drop-shadow-[0_0_12px_rgba(255,0,145,0.4)]" />
          </div>
          <span className="font-black text-lg text-white tracking-tight">Vinylflix</span>
        </Link>

        {user ? (
          <Link
            to="/wallet"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-bold text-[#FF0091] pointer-events-auto shadow-sm"
          >
            <WalletIcon className="w-3.5 h-3.5 text-[#FF0091]" />
            <span>₦{(user.wallet?.availableBalance || 0).toLocaleString()}</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-[#FF0091] to-[#360099] text-white text-xs font-bold pointer-events-auto shadow-md shadow-[#FF0091]/20"
          >
            Log In
          </Link>
        )}
      </header>

      {/* 3. MAIN CONTENT VIEWPORT */}
      <main
        className={`flex-1 min-w-0 ${
          isFeed
            ? 'absolute inset-0 w-full h-full overflow-hidden p-0 z-10 md:relative md:h-screen'
            : 'p-4 sm:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-8'
        }`}
      >
        {children}
      </main>

      {/* 4. MOBILE BOTTOM NAVIGATION TABS (hidden on desktop/tablet) */}
      <nav
        className={`md:hidden z-40 px-2 flex items-center justify-around transition-all ${
          isFeed
            ? 'absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/95 via-black/80 to-transparent pointer-events-auto'
            : 'fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-2xl pointer-events-auto'
        }`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all pointer-events-auto ${
                active ? 'text-[#FF0091] scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-[#FF0091]' : 'text-slate-400'}`} />
              <span className="text-[10px] font-semibold mt-1 tracking-tight">{item.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-[#FF0091] shadow-[0_0_8px_#FF0091] mt-0.5" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
