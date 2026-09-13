import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs min-h-[32px]',
    md: 'px-3.5 py-1.5 text-xs min-h-[36px]',
    lg: 'px-5 py-2.5 text-sm min-h-[44px]',
  }[size];

  const variantClasses = {
    primary: 'bg-[#0B0B0B] text-[#F5F3EE] hover:bg-[#0B0B0B]/85 border border-[#0B0B0B]',
    secondary: 'bg-[#0B0B0B]/5 text-[#0B0B0B] hover:bg-[#0B0B0B]/10 border border-[#0B0B0B]/15',
    outline: 'bg-transparent text-[#0B0B0B] hover:bg-[#0B0B0B]/5 border border-[#0B0B0B]/20',
    ghost: 'bg-transparent text-[#0B0B0B]/70 hover:text-[#0B0B0B] hover:bg-[#0B0B0B]/5 border border-transparent',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-1.5 font-mono font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
