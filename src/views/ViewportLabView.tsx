import React, { useState } from 'react';
import { ResponsiveIssue } from '../types';
import { EmptyState } from '../components/common/EmptyState';

interface ViewportLabViewProps {
  onSelectIssue: (issue: ResponsiveIssue) => void;
  activeIssues: ResponsiveIssue[];
  initialViewportDim?: string;
  autofixActive: boolean;
}

export const ViewportLabView: React.FC<ViewportLabViewProps> = () => {
  const [url, setUrl] = useState('');

  return <div className="space-y-6 max-w-6xl mx-auto pb-16">
    <div><h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0B]">Viewport Lab</h1>
      <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-1">Inspect responsive behavior across observed viewport dimensions.</p></div>
    <section className="border border-[#0B0B0B]/10 rounded-md p-4 bg-[#F5F3EE]">
      <label htmlFor="viewport-url" className="block text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50 mb-2">Manual test URL</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input id="viewport-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)}
          placeholder="https://your-application.com" className="flex-1 px-3 py-2 text-xs font-mono bg-[#F5F3EE] border border-[#0B0B0B]/20 rounded-md focus:outline-none focus:border-[#0B0B0B]" />
        <button type="button" disabled={!url.trim()} className="px-4 py-2 bg-[#0B0B0B] text-[#F5F3EE] text-xs font-mono rounded-md disabled:opacity-40">Run Test</button>
      </div>
    </section>
    <EmptyState title="No viewport data yet" description="Real viewport dimensions observed from your application will appear here." />
  </div>;
};
