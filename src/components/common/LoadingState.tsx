import React from 'react';
import { LoaderCircle } from 'lucide-react';

export const LoadingState: React.FC<{ label?: string; detail?: string }> = ({ label = 'Loading data...', detail }) => (
  <div role="status" aria-live="polite" aria-busy="true" className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center p-6">
    <div className="w-full max-w-xs border border-[#0B0B0B]/10 rounded-lg bg-[#F5F3EE] px-6 py-7 text-center shadow-[0_18px_50px_rgba(11,11,11,0.14)]">
      <LoaderCircle className="w-8 h-8 mx-auto text-[#0B0B0B]/75 animate-spin" aria-hidden="true" />
      <p className="mt-4 text-xs font-mono text-[#0B0B0B]/75">{label}</p>
      {detail && <p className="mt-1.5 text-[11px] font-mono text-[#0B0B0B]/45">{detail}</p>}
    </div>
  </div>
);
