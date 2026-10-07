import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, Landmark, X } from 'lucide-react';

export interface BankOption {
  name: string;
  slug: string;
  code: string;
  logo?: string;
}

// Comprehensive initial list so the dropdown renders instantaneously
const INITIAL_FALLBACK_BANKS: BankOption[] = [
  { name: 'OPay Digital Services Limited (Paycom)', slug: 'opay-digital-services-limited-paycom', code: '999992' },
  { name: 'PalmPay', slug: 'palmpay', code: '999991' },
  { name: 'Moniepoint MFB', slug: 'moniepoint-mfb-ng', code: '50515' },
  { name: 'Kuda Bank', slug: 'kuda-bank', code: '50211' },
  { name: 'Guaranty Trust Bank (GTBank)', slug: 'guaranty-trust-bank', code: '058' },
  { name: 'Zenith Bank', slug: 'zenith-bank', code: '057' },
  { name: 'Access Bank', slug: 'access-bank', code: '044' },
  { name: 'First Bank of Nigeria', slug: 'first-bank-of-nigeria', code: '011' },
  { name: 'United Bank For Africa (UBA)', slug: 'united-bank-for-africa', code: '033' },
  { name: 'Wema Bank (ALAT)', slug: 'wema-bank', code: '035' },
  { name: 'Stanbic IBTC Bank', slug: 'stanbic-ibtc-bank', code: '039' },
  { name: 'Fidelity Bank', slug: 'fidelity-bank', code: '070' },
  { name: 'First City Monument Bank (FCMB)', slug: 'first-city-monument-bank', code: '214' },
  { name: 'Sterling Bank', slug: 'sterling-bank', code: '232' },
  { name: 'Union Bank of Nigeria', slug: 'union-bank-of-nigeria', code: '032' },
  { name: 'Polaris Bank', slug: 'polaris-bank', code: '076' },
  { name: 'Ecobank Nigeria', slug: 'ecobank-nigeria', code: '050' },
  { name: 'Keystone Bank', slug: 'keystone-bank', code: '082' },
  { name: 'Jaiz Bank', slug: 'jaiz-bank', code: '301' },
  { name: 'Providus Bank', slug: 'providus-bank', code: '101' },
  { name: 'Taj Bank', slug: 'taj-bank', code: '302' },
  { name: 'VFD Microfinance Bank', slug: 'vfd', code: '566' },
  { name: 'Rubies MFB', slug: 'rubies-mfb', code: '125' },
  { name: 'Fairmoney Microfinance Bank', slug: 'fairmoney-microfinance-bank-ng', code: '51318' },
  { name: 'Carbon', slug: 'carbon', code: '565' },
];

const POPULAR_SLUGS = [
  'opay-digital-services-limited-paycom',
  'paycom',
  'palmpay',
  'moniepoint-mfb-ng',
  'kuda-bank',
  'guaranty-trust-bank',
  'zenith-bank',
  'access-bank',
  'first-bank-of-nigeria',
  'united-bank-for-africa',
  'wema-bank',
  'stanbic-ibtc-bank',
  'fidelity-bank',
  'first-city-monument-bank',
  'sterling-bank',
  'union-bank-of-nigeria',
];

interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
}

export const BankSelect: React.FC<{
  value: string;
  onChange: (bankName: string, bankCode?: string, bankOption?: BankOption) => void;
  onSelectBank?: (bank: BankOption) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, onSelectBank, placeholder = 'Select Bank...', className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const [banks, setBanks] = useState<BankOption[]>(
    INITIAL_FALLBACK_BANKS.map((b) => ({
      ...b,
      logo: `https://cdn.jsdelivr.net/gh/ichtrojan/nigerian-banks/logos/${b.slug}.png`,
    }))
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch full live list from Paystack Public Banks API
  useEffect(() => {
    let active = true;
    const loadPaystackBanks = async () => {
      try {
        const response = await fetch('https://api.paystack.co/bank?country=nigeria&use_cursor=false&perPage=100');
        const resData = await response.json();
        if (active && resData.status && Array.isArray(resData.data) && resData.data.length > 0) {
          const fetchedList: BankOption[] = resData.data.map((b: any) => ({
            name: b.name,
            slug: b.slug,
            code: b.code,
            logo: `https://cdn.jsdelivr.net/gh/ichtrojan/nigerian-banks/logos/${b.slug}.png`,
          }));

          // Sort with top Nigerian banks prioritized
          const sorted = fetchedList.sort((a, b) => {
            const aPop = POPULAR_SLUGS.includes(a.slug);
            const bPop = POPULAR_SLUGS.includes(b.slug);
            if (aPop && !bPop) return -1;
            if (!aPop && bPop) return 1;
            return a.name.localeCompare(b.name);
          });

          setBanks(sorted);
        }
      } catch {
        // Maintain fallback list on error
      }
    };

    loadPaystackBanks();
    return () => {
      active = false;
    };
  }, []);

  // Viewport-aware position calculation
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const estimatedHeight = 280;
    const spaceBelow = windowHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    const shouldPlaceTop = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const placement = shouldPlaceTop ? 'top' : 'bottom';
    const maxHeight = Math.min(340, Math.max(160, shouldPlaceTop ? spaceAbove : spaceBelow));

    const calculatedWidth = Math.max(rect.width, 240);
    const finalWidth = Math.min(calculatedWidth, windowWidth - 24);

    let left = rect.left;
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
  }, []);

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

  // Auto-focus search input upon opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Resolve currently selected bank item (matches by name or code)
  const selectedBank = useMemo(() => {
    if (!value) return null;
    return (
      banks.find(
        (b) =>
          b.code === value ||
          b.name.toLowerCase() === value.toLowerCase() ||
          (value.toLowerCase().includes('opay') && b.slug.includes('paycom')) ||
          (value.toLowerCase().includes('palmpay') && b.slug.includes('palmpay')) ||
          (value.toLowerCase().includes('kuda') && b.slug.includes('kuda')) ||
          (value.toLowerCase().includes('moniepoint') && b.slug.includes('moniepoint'))
      ) || null
    );
  }, [banks, value]);

  // Live search filtering
  const filteredBanks = useMemo(() => {
    if (!search.trim()) return banks;
    const query = search.toLowerCase();
    return banks.filter(
      (b) => b.name.toLowerCase().includes(query) || (b.code && b.code.includes(query))
    );
  }, [banks, search]);

  return (
    <>
      <div className={`relative inline-block w-full ${className || ''}`}>
        {/* Custom Dropdown Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-[#FF0091] focus:ring-1 focus:ring-[#FF0091]/30 transition-all flex items-center justify-between gap-2 shadow-inner hover:border-slate-700 min-h-[42px]"
        >
          <div className="flex items-center gap-2.5 truncate">
            {selectedBank ? (
              <BankLogo bank={selectedBank} />
            ) : value === 'Other Bank' ? (
              <div className="w-6 h-6 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 text-[10px] font-bold flex-shrink-0">
                <Landmark className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                <Landmark className="w-3.5 h-3.5" />
              </div>
            )}
            <span className={`truncate ${!selectedBank && !value ? 'text-slate-500' : 'text-slate-100'}`}>
              {selectedBank?.name || (value === 'Other Bank' ? 'Other Bank / Fintech' : value) || placeholder}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
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
            className="bg-slate-900/98 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Instant Search Bar */}
            <div className="p-2.5 border-b border-slate-800 bg-slate-950/95 flex items-center gap-2 flex-shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bank name or code..."
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

            {/* Scrollable Bank Options */}
            <div className="overflow-y-auto p-1.5 space-y-1 flex-1">
              {filteredBanks.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No banks match "{search}"
                </div>
              ) : (
                filteredBanks.map((bank) => {
                  const isSelected =
                    value === bank.code ||
                    value.toLowerCase() === bank.name.toLowerCase() ||
                    (value.toLowerCase().includes('opay') && bank.slug.includes('paycom'));
                  return (
                    <button
                      key={`${bank.code}-${bank.slug}`}
                      type="button"
                      onClick={() => {
                        onChange(bank.name, bank.code, bank);
                        if (onSelectBank) onSelectBank(bank);
                        setIsOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between gap-2.5 transition-colors ${
                        isSelected
                          ? 'bg-pink-500/15 text-pink-300 font-bold border border-pink-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <BankLogo bank={bank} />
                        <span className="truncate">{bank.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-pink-400 flex-shrink-0" />}
                    </button>
                  );
                })
              )}

              {/* Manual 'Other Bank' Choice */}
              <button
                type="button"
                onClick={() => {
                  onChange('Other Bank', 'OTHER');
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2.5 transition-colors border-t border-slate-800/80 mt-1 ${
                  value === 'Other Bank'
                    ? 'bg-pink-500/15 text-pink-300 font-bold border border-pink-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 text-[10px] font-bold flex-shrink-0">
                    <Landmark className="w-3.5 h-3.5" />
                  </div>
                  <span>Other Bank / Fintech</span>
                </div>
                {value === 'Other Bank' && <Check className="w-4 h-4 text-pink-400 flex-shrink-0" />}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

const BankLogo: React.FC<{ bank: BankOption }> = ({ bank }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !bank.logo) {
    const initials = bank.name
      .replace(/[()]/g, '')
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();

    return (
      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-[10px] font-black text-pink-300 flex-shrink-0">
        {initials || <Landmark className="w-3 h-3" />}
      </div>
    );
  }

  return (
    <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
      <img
        src={bank.logo}
        alt={bank.name}
        onError={() => setFailed(true)}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
};
