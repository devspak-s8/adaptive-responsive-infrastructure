import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  id?: string;
  className?: string;
  buttonClassName?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  ariaLabel,
  id,
  className = '',
  buttonClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`flex items-center justify-between gap-2 min-h-[36px] px-2.5 py-1.5 rounded-md border border-[#0B0B0B]/20 bg-[#F5F3EE] text-xs font-mono text-[#0B0B0B] hover:bg-[#0B0B0B]/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0B]/25 ${buttonClassName}`}
      >
        <span className="truncate">{selected?.label ?? 'Select an option'}</span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" aria-label={ariaLabel} className="motion-popover absolute left-0 top-[calc(100%+6px)] z-50 min-w-full w-max max-w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#0B0B0B]/15 bg-[#fffdf8] p-1.5 shadow-[0_18px_45px_rgba(11,11,11,0.18)]">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(option.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-4 rounded-md px-2.5 py-2.5 text-left text-xs font-mono whitespace-nowrap transition-colors ${isSelected ? 'bg-[#0B0B0B] text-[#F5F3EE]' : 'text-[#0B0B0B] hover:bg-[#0B0B0B]/[0.06]'}`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
