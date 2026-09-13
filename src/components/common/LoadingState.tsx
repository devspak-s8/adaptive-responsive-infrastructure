import React from 'react';

export const LoadingState: React.FC<{ label?: string; detail?: string }> = ({ label = 'Loading data...', detail }) => (
  <div role="status" aria-live="polite" aria-busy="true" className="border border-[#0B0B0B]/10 rounded-md bg-[#F5F3EE] p-8 sm:p-10">
    <div className="max-w-sm mx-auto space-y-4">
      <div className="flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#0B0B0B] animate-pulse" />
        <span className="text-xs font-mono text-[#0B0B0B]/70">{label}</span>
      </div>
      <div className="space-y-2 animate-pulse" aria-hidden="true">
        <div className="h-2 rounded bg-[#0B0B0B]/10 w-full" />
        <div className="h-2 rounded bg-[#0B0B0B]/10 w-4/5 mx-auto" />
        <div className="h-2 rounded bg-[#0B0B0B]/10 w-3/5 mx-auto" />
      </div>
      {detail && <p className="text-[11px] font-mono text-[#0B0B0B]/45 text-center">{detail}</p>}
    </div>
  </div>
);
