import React from 'react';

export const LoadingState: React.FC<{ label?: string; detail?: string }> = ({ label = 'Loading data...', detail }) => (
  <div role="status" aria-live="polite" aria-busy="true" className="loading-state">
    <div className="loading-card">
      <span className="loading-spinner" aria-hidden="true" />
      <p className="mt-4 text-xs font-mono text-[#0B0B0B]/75">{label}</p>
      {detail && <p className="mt-1.5 text-[11px] font-mono text-[#0B0B0B]/45">{detail}</p>}
    </div>
  </div>
);
