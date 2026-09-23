import React from 'react';
import { Toast, ToastType } from '../context/ToastContext.js';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle2,
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        border: 'border-emerald-500/30',
        glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
        progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        defaultTitle: 'Success',
      };
    case 'error':
      return {
        icon: AlertCircle,
        iconColor: 'text-rose-400',
        iconBg: 'bg-rose-500/10 border-rose-500/20',
        border: 'border-rose-500/30',
        glow: 'shadow-[0_4px_20px_rgba(244,63,94,0.18)]',
        progressBar: 'bg-gradient-to-r from-rose-500 to-red-600',
        defaultTitle: 'Error',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-500/10 border-amber-500/20',
        border: 'border-amber-500/30',
        glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
        progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
        defaultTitle: 'Warning',
      };
    case 'info':
    default:
      return {
        icon: Info,
        iconColor: 'text-sky-400',
        iconBg: 'bg-sky-500/10 border-sky-500/20',
        border: 'border-sky-500/30',
        glow: 'shadow-[0_4px_20px_rgba(56,189,248,0.15)]',
        progressBar: 'bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#38BDF8]',
        defaultTitle: 'Notice',
      };
  }
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((t) => {
        const config = getToastConfig(t.type);
        const IconComponent = config.icon;

        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto w-full bg-slate-900/95 backdrop-blur-xl border ${config.border} ${config.glow} rounded-2xl p-4 shadow-2xl relative overflow-hidden transition-all duration-300 animate-in slide-in-from-top-3 fade-in group`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${config.iconBg} ${config.iconColor}`}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                {t.title && (
                  <h4 className="text-xs font-bold text-white tracking-tight mb-0.5">
                    {t.title}
                  </h4>
                )}
                <p className="text-xs text-slate-200 leading-relaxed break-words font-medium">
                  {t.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => onRemove(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0 -mr-1 -mt-1"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown Progress Bar */}
            {t.duration > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60 overflow-hidden">
                <div
                  className={`h-full ${config.progressBar} animate-toast-progress`}
                  style={{
                    animationDuration: `${t.duration}ms`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
