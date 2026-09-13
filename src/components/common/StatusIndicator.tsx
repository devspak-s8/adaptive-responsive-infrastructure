import React from 'react';

export interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'broken' | 'neutral' | 'active';
  label?: string;
  size?: 'sm' | 'md';
  showPulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'sm',
  showPulse = false,
}) => {
  const dotColor = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    broken: 'bg-rose-500',
    neutral: 'bg-[#0B0B0B]/40',
    active: 'bg-[#0B0B0B]',
  }[status];

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
      <span className="relative flex items-center justify-center">
        {showPulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${dotColor}`} />
      </span>
      {label && <span className="text-[#0B0B0B]/80">{label}</span>}
    </span>
  );
};
