import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  HelpCircle,
  X,
  RefreshCw,
} from 'lucide-react';

export interface AdminActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue?: string) => Promise<void> | void;
  title: string;
  description?: string;
  variant?: 'danger' | 'warning' | 'success' | 'primary' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  initialValue?: string;
  isPrompt?: boolean;
  isTextArea?: boolean;
  inputRequired?: boolean;
  details?: Array<{ label: string; value: React.ReactNode }>;
  loading?: boolean;
}

export const AdminActionModal: React.FC<AdminActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'primary',
  confirmText,
  cancelText = 'Cancel',
  inputLabel,
  inputPlaceholder = 'Enter reason or notes...',
  initialValue = '',
  isPrompt = false,
  isTextArea = false,
  inputRequired = false,
  details = [],
  loading = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
      setError(null);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPrompt && inputRequired && !inputValue.trim()) {
      setError(`${inputLabel || 'Input'} is required.`);
      return;
    }
    setError(null);
    await onConfirm(isPrompt ? inputValue.trim() : undefined);
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-5 h-5 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'prompt':
        return <AlertCircle className="w-5 h-5 text-pink-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-pink-400" />;
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-rose-600/30';
      case 'success':
        return 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30';
      case 'warning':
        return 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white shadow-amber-600/30';
      default:
        return 'bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] hover:opacity-95 text-white shadow-[#FF0091]/30';
    }
  };

  const defaultConfirmText = isPrompt
    ? 'Submit'
    : variant === 'danger'
    ? 'Delete / Confirm'
    : variant === 'success'
    ? 'Approve'
    : 'Confirm Action';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                variant === 'danger'
                  ? 'bg-rose-500/10 border-rose-500/20'
                  : variant === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : variant === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-pink-500/10 border-pink-500/20'
              }`}
            >
              {getIcon()}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Key-Value Box if provided */}
        {details.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
            {details.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-medium">{item.label}</span>
                <span className="font-semibold text-slate-200 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Form Body for Prompts */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isPrompt && (
            <div className="space-y-1.5">
              {inputLabel && (
                <label className="block text-xs font-semibold text-slate-300">
                  {inputLabel} {inputRequired && <span className="text-rose-400">*</span>}
                </label>
              )}
              {isTextArea ? (
                <textarea
                  rows={3}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF0091] transition-colors"
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF0091] transition-colors"
                  autoFocus
                />
              )}
              {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors text-center disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] ${getConfirmButtonClasses()}`}
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {confirmText || defaultConfirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
