import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'dark' | 'outline' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    neutral: 'bg-[#0B0B0B]/5 text-[#0B0B0B]/70 border border-[#0B0B0B]/10',
    dark: 'bg-[#0B0B0B] text-[#F5F3EE] border border-[#0B0B0B]',
    outline: 'bg-transparent text-[#0B0B0B]/70 border border-[#0B0B0B]/20',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    error: 'bg-rose-50 text-rose-800 border border-rose-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
