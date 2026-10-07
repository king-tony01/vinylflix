import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  align?: 'left' | 'right';
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  searchable = false,
  searchPlaceholder = 'Search...',
  icon,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  size = 'md',
  disabled = false,
  align = 'left',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Auto-focus search input if searchable
  useEffect(() => {
    if (isOpen) {
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearch('');
    }
  }, [isOpen, searchable]);

  // Selected Option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  // Filtered Options
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-lg min-h-[30px]',
    md: 'px-3.5 py-2 text-xs rounded-xl min-h-[36px]',
    lg: 'px-4 py-2.5 text-sm rounded-xl min-h-[42px]',
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-[#FF0091] focus:ring-1 focus:ring-[#FF0091]/30 transition-all flex items-center justify-between gap-2 shadow-inner hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon ? (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          ) : (
            icon && <span className="flex-shrink-0">{icon}</span>
          )}
          <span className={`truncate ${!selectedOption ? 'text-slate-500' : 'text-slate-100'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && <span className="flex-shrink-0">{selectedOption.badge}</span>}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-[#FF0091]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-1.5 z-50 min-w-full w-max max-w-sm bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
        >
          {/* Search Bar if searchable */}
          {searchable && (
            <div className="p-2 border-b border-slate-800 bg-slate-950/90 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between gap-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-pink-500/15 text-pink-300 font-bold border border-pink-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <span className="truncate block">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {opt.badge}
                      {isSelected && <Check className="w-3.5 h-3.5 text-pink-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
