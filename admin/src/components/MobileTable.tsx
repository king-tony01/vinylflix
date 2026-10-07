import React from 'react';
import { ChevronRight, RefreshCw, Layers } from 'lucide-react';

export interface MobileTableProps {
  children: React.ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export const MobileTable: React.FC<MobileTableProps> = ({
  children,
  loading = false,
  isEmpty = false,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try changing your filter or search criteria.',
  emptyIcon,
  loadingText = 'Loading data...',
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`p-8 sm:p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2.5 ${className}`}>
        <RefreshCw className="w-5 h-5 animate-spin text-[#FF0091]" />
        <span className="font-medium text-slate-400">{loadingText}</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`p-8 sm:p-12 text-center text-slate-500 space-y-2.5 ${className}`}>
        {emptyIcon || <Layers className="w-10 h-10 mx-auto text-slate-700" />}
        <p className="font-bold text-slate-300 text-sm">{emptyTitle}</p>
        {emptySubtitle && <p className="text-xs text-slate-500 max-w-xs mx-auto">{emptySubtitle}</p>}
      </div>
    );
  }

  return (
    <div className={`divide-y divide-slate-800/80 w-full max-w-full overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export interface MobileTableRowProps {
  onClick?: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  avatar?: React.ReactNode;
  dataGrid?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const MobileTableRow: React.FC<MobileTableRowProps> = ({
  onClick,
  title,
  subtitle,
  badge,
  avatar,
  dataGrid,
  actions,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 space-y-3 w-full max-w-full overflow-hidden transition-colors ${
        onClick ? 'cursor-pointer active:bg-slate-850/80 hover:bg-slate-800/40 select-none' : ''
      } ${className}`}
    >
      {/* Top Bar: Avatar/Icon + Title & Subtitle + Badge */}
      <div className="flex items-start justify-between gap-2.5 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {avatar && <div className="flex-shrink-0">{avatar}</div>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="font-bold text-white text-sm tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {title}
              </div>
            </div>
            {subtitle && (
              <div className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[220px] sm:max-w-sm">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>

      {/* Structured Key-Value Micro Grid */}
      {dataGrid && (
        <div className="w-full bg-slate-950/90 rounded-xl p-3 border border-slate-800/80 text-xs space-y-2">
          {dataGrid}
        </div>
      )}

      {/* Actions Row */}
      {actions && (
        <div
          className="pt-1 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  );
};

export interface MobileDataCellProps {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  highlightColor?: string;
  copyable?: boolean;
}

export const MobileDataCell: React.FC<MobileDataCellProps> = ({
  label,
  value,
  highlight = false,
  highlightColor = 'text-white',
  copyable = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof value === 'string' || typeof value === 'number') {
      navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 w-full text-xs">
      <span className="text-slate-400 font-medium text-[11px] flex-shrink-0">{label}:</span>
      <div className="flex items-center gap-1.5 font-semibold text-right min-w-0 truncate">
        <span className={`truncate ${highlight ? highlightColor : 'text-slate-200'}`}>{value}</span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="text-[10px] text-pink-400 hover:text-pink-300 font-mono ml-1 flex-shrink-0"
          >
            {copied ? '✓' : 'copy'}
          </button>
        )}
      </div>
    </div>
  );
};
