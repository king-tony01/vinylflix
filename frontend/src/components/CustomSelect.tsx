import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
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
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic viewport-aware repositioning
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const estimatedHeight = 260;
    const spaceBelow = windowHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    const shouldPlaceTop = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const placement = shouldPlaceTop ? 'top' : 'bottom';
    const maxHeight = Math.min(320, Math.max(140, shouldPlaceTop ? spaceAbove : spaceBelow));

    // Dynamic width calculation
    const calculatedWidth = Math.max(rect.width, 160);
    const finalWidth = Math.min(calculatedWidth, windowWidth - 24);

    let left = align === 'right' ? rect.right - finalWidth : rect.left;

    // Viewport edge containment
    if (left + finalWidth > windowWidth - 12) {
      left = windowWidth - finalWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    if (placement === 'top') {
      setPosition({
        bottom: windowHeight - rect.top + 6,
        left,
        width: finalWidth,
        maxHeight,
        placement: 'top',
      });
    } else {
      setPosition({
        top: rect.bottom + 6,
        left,
        width: finalWidth,
        maxHeight,
        placement: 'bottom',
      });
    }
  }, [align]);

  // Update position on open
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const frame = requestAnimationFrame(updatePosition);
      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen, updatePosition]);

  // Handle outside click, document scroll, and window resize
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Auto-focus search input if searchable
  useEffect(() => {
    if (isOpen) {
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
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
    sm: 'px-2.5 py-1.5 text-xs rounded-lg min-h-[32px]',
    md: 'px-3.5 py-2 text-xs rounded-xl min-h-[38px]',
    lg: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]',
  };

  return (
    <>
      <div className={`relative inline-block w-full ${className}`}>
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
            }
          }}
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
      </div>

      {/* Popover Dropdown Menu Portalled to document.body */}
      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: position.top !== undefined ? `${position.top}px` : undefined,
              bottom: position.bottom !== undefined ? `${position.bottom}px` : undefined,
              left: `${position.left}px`,
              width: `${position.width}px`,
              maxHeight: `${position.maxHeight}px`,
              zIndex: 99999,
            }}
            className={`bg-slate-900/98 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
          >
            {/* Search Bar if searchable */}
            {searchable && (
              <div className="p-2 border-b border-slate-800 bg-slate-950/95 flex items-center gap-2 flex-shrink-0">
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
            <div className="overflow-y-auto p-1.5 space-y-1 flex-1">
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
          </div>,
          document.body
        )}
    </>
  );
}
