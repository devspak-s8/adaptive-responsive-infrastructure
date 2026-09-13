import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => (
  <div className={`border border-[#0B0B0B]/10 rounded-md bg-[#F5F3EE] p-8 sm:p-12 text-center ${className}`}>
    <div className="text-sm font-medium text-[#0B0B0B]">{title}</div>
    <p className="text-xs font-mono text-[#0B0B0B]/50 mt-1.5 max-w-lg mx-auto leading-relaxed">
      {description}
    </p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 px-3.5 py-2 text-xs font-mono bg-[#0B0B0B] text-[#F5F3EE] rounded-md hover:bg-[#0B0B0B]/85 transition-colors min-h-[36px]"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
