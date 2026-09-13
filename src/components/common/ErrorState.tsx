import React from 'react';

export const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="border border-[#0B0B0B]/20 rounded-md bg-[#F5F3EE] p-8 text-center">
    <div className="text-sm font-medium">Unable to load project data</div>
    <p className="text-xs font-mono text-[#0B0B0B]/60 mt-1.5">{message}</p>
    <button type="button" onClick={onRetry} className="mt-4 px-3.5 py-2 text-xs font-mono bg-[#0B0B0B] text-[#F5F3EE] rounded-md">Retry</button>
  </div>
);
