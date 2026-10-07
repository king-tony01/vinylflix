import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  width?: string;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon,
  children,
  footerActions,
  width = 'max-w-md sm:max-w-lg',
}) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-in fade-in select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className={`relative w-full ${width} bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-200 overflow-hidden font-sans`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/60 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 text-[#FF0091]">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white truncate tracking-tight">
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-300">
          {children}
        </div>

        {/* Drawer Footer Actions (if provided) */}
        {footerActions && (
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              {footerActions}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

// Sub-component for structured metadata sections inside the drawer
export const DrawerSection: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => (
  <div className={`space-y-2.5 ${className}`}>
    {title && (
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
    )}
    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
      {children}
    </div>
  </div>
);

// Sub-component for individual key-value rows
export const DrawerItem: React.FC<{
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
}> = ({ label, value, copyable = false }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (typeof value === 'string' || typeof value === 'number') {
      navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-400 font-medium">{label}</span>
      <div className="flex items-center gap-1.5 font-semibold text-white text-right truncate">
        <span className="truncate">{value}</span>
        {copyable && (
          <button
            onClick={handleCopy}
            title="Copy value"
            className="text-[10px] text-pink-400 hover:text-pink-300 underline font-mono"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
};
