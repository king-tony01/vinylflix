import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.js';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Layers,
  Settings,
  ShieldAlert,
  FileText,
  LogOut,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminUser, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { path: '/withdrawals', label: 'Withdrawals Queue', icon: DollarSign },
    { path: '/users', label: 'User Governance', icon: Users },
    { path: '/campaigns', label: 'Campaign Reviews', icon: Layers },
    { path: '/configs', label: 'Platform Config', icon: Settings },
    { path: '/risk', label: 'Risk Surveillance', icon: ShieldAlert },
    { path: '/audit', label: 'Audit Trail', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          {/* Admin Header / Brand */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                Vinylflix Admin
              </h2>
              <p className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">
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
                      ? 'bg-purple-600/15 text-purple-400 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
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
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            <span>Open Consumer App</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          {/* Admin Profile Box */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                {adminUser?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{adminUser?.username}</p>
                <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
