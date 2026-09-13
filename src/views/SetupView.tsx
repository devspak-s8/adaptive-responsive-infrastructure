import React from 'react';
import { ProjectItem } from '../types';
import { EmptyState } from '../components/common/EmptyState';

interface SetupViewProps { project: ProjectItem | null }

export const SetupView: React.FC<SetupViewProps> = ({ project }) => {
  if (!project) {
    return <div className="max-w-4xl mx-auto pb-16"><EmptyState title="No project selected"
      description="Create a project before installing and connecting the runtime." /></div>;
  }

  const installCommand = 'npm install @product/react';
  const integrationCode = `import { AdaptiveUI } from "@product/react";

export default function App({ children }) {
  return <AdaptiveUI projectId="${project.id}">{children}</AdaptiveUI>;
}`;

  return <div className="space-y-8 max-w-4xl mx-auto pb-16">
    <div><h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Install Runtime</h1>
      <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-1">Integrate the Adaptive observer into your React application tree.</p></div>
    <section className="space-y-3"><div className="text-xs font-mono uppercase tracking-wider text-[#0B0B0B]/50">1 · Install package</div>
      <pre className="bg-[#0B0B0B] text-[#F5F3EE] p-4 rounded-md font-mono text-xs overflow-x-auto">{installCommand}</pre></section>
    <section className="space-y-3"><div className="text-xs font-mono uppercase tracking-wider text-[#0B0B0B]/50">2 · Connect project</div>
      <pre className="bg-[#0B0B0B] text-[#F5F3EE] p-4 rounded-md font-mono text-xs overflow-x-auto">{integrationCode}</pre></section>
    <section className="space-y-2 border-t border-[#0B0B0B]/10 pt-5"><div className="text-xs font-mono uppercase tracking-wider text-[#0B0B0B]/50">3 · Verify</div>
      <p className="text-sm">Deploy your application. Connection status will update after the runtime reports its first real heartbeat.</p>
      <span className="inline-block text-xs font-mono border border-[#0B0B0B]/20 px-2 py-1 rounded">Waiting for first connection</span></section>
  </div>;
};
