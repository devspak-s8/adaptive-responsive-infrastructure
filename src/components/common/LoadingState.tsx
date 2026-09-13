import React from 'react';

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading data…' }) => (
  <div className="border border-[#0B0B0B]/10 rounded-md bg-[#F5F3EE] p-10 text-center text-xs font-mono text-[#0B0B0B]/60">
    {label}
  </div>
);
