import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.js';
import { VinylflixLogo } from './VinylflixLogo.js';
import {
  LayoutDashboard,
  Film,
  DollarSign,
  CreditCard,
  Users,
  Layers,
  Settings,
  ShieldAlert,
  FileText,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminUser, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Auto-close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { path: '/videos', label: 'Video Library & Curation', icon: Film },
    { path: '/campaigns', label: 'Campaign Reviews', icon: Layers },
    { path: '/payments', label: 'Bank Transfers', icon: CreditCard },
    { path: '/withdrawals', label: 'Withdrawals Queue', icon: DollarSign },
    { path: '/users', label: 'User Governance', icon: Users },
    { path: '/configs', label: 'Platform Config', icon: Settings },
    { path: '/risk', label: 'Risk Surveillance', icon: ShieldAlert },
    { path: '/audit', label: 'Audit Trail', icon: FileText },
  ];

  const currentNav = navItems.find((item) => item.path === location.pathname) || navItems[0];

  return (
    <div className="h-screen h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* 1. MOBILE TOP APP BAR (Visible on < lg screens) */}
      <header className="lg:hidden flex-shrink-0 sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-pink-500/40 transition-colors"
            title="Open Admin Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <VinylflixLogo className="w-7 h-7 drop-shadow-[0_0_10px_rgba(255,0,145,0.4)]" />
            <div>
              <span className="font-black text-sm text-white tracking-tight">Vinylflix</span>
              <span className="text-[10px] text-pink-400 font-bold ml-1.5 uppercase tracking-wider">Admin</span>
            </div>
          </div>
        </div>

        {/* Current Active Tab Title on Mobile */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF0091] to-[#360099] flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-[#FF0091]/20">
            {adminUser?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MOBILE DRAWER OVERLAY & SIDE PANEL */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[82vw] bg-slate-900 border-r border-slate-800 h-full p-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <VinylflixLogo className="w-8 h-8 drop-shadow-[0_0_12px_rgba(255,0,145,0.45)]" />
                  <div>
                    <h2 className="font-bold text-sm text-white tracking-tight">Vinylflix Admin</h2>
                    <p className="text-[9px] text-pink-400 font-semibold tracking-wider uppercase">
                      Governance & Risk
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="space-y-1 overflow-y-auto max-h-[calc(100dvh-220px)] pr-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#FF0091]/20 to-[#360099]/15 text-pink-300 border border-[#FF0091]/40 shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF0091]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#FF0091]" />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                <span>Open Consumer App</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF0091] to-[#360099] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {adminUser?.username?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{adminUser?.username}</p>
                    <span className="text-[9px] font-bold uppercase text-pink-400">
                      {adminUser?.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DESKTOP SIDEBAR (Visible on >= lg screens) */}
      <aside className="hidden lg:flex w-64 bg-slate-900/95 border-r border-slate-800 flex-col justify-between p-4 flex-shrink-0 backdrop-blur-xl h-full overflow-y-auto select-none">
        <div className="space-y-6">
          {/* Admin Header / Brand */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <VinylflixLogo className="w-9 h-9 drop-shadow-[0_0_12px_rgba(255,0,145,0.45)]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                Vinylflix Admin
              </h2>
              <p className="text-[10px] text-pink-400 font-semibold tracking-wider uppercase">
                Governance & Risk
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF0091]/20 to-[#360099]/15 text-pink-300 border border-[#FF0091]/40 shadow-sm shadow-[#FF0091]/10'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF0091]' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Admin Profile & Controls */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          {/* Main User App Switcher Link */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            <span>Open Consumer App</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          {/* Admin Profile Box */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF0091] to-[#360099] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md shadow-[#FF0091]/20">
                {adminUser?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{adminUser?.username}</p>
                <span className="text-[9px] font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20">
                  {adminUser?.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out of Admin Console"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto bg-slate-950 p-3.5 sm:p-5 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto w-full">{children}</div>
      </main>

      {/* 5. MOBILE BOTTOM QUICK NAVIGATION BAR (Visible on mobile only) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 border-t border-slate-800 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around select-none">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            location.pathname === '/' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px]">Overview</span>
        </Link>

        <Link
          to="/videos"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            location.pathname === '/videos' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span className="text-[10px]">Videos</span>
        </Link>

        <Link
          to="/campaigns"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            location.pathname === '/campaigns' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px]">Campaigns</span>
        </Link>

        <Link
          to="/payments"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
            location.pathname === '/payments' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px]">Payments</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>
    </div>
  );
};
