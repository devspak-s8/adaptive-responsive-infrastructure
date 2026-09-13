import React from 'react';
import { ExternalLink, Settings } from 'lucide-react';
import { PageType, ProjectItem, ResponsiveIssue, ViewportItem } from '../types';
import { EmptyState } from '../components/common/EmptyState';

interface OverviewViewProps {
  project: ProjectItem | null;
  viewports: ViewportItem[];
  issues: ResponsiveIssue[];
  autofixCount: number;
  onNavigate: (page: PageType) => void;
  onSelectIssue: (issue: ResponsiveIssue) => void;
  onSelectViewportInLab: (viewport: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ project, viewports, issues, autofixCount, onNavigate }) => {
  if (!project) {
    return <div className="max-w-6xl mx-auto pb-16 pt-2"><EmptyState title="No projects yet"
      description="Create your first project to start monitoring how your interface behaves across real-world viewports."
      actionLabel="Create Project" onAction={() => onNavigate('projects')} /></div>;
  }

  const openIssues = issues.filter((issue) => issue.status === 'Open');
  const metric = (label: string, value: React.ReactNode) => (
    <div className="p-4 sm:p-5"><div className="text-xs font-mono uppercase tracking-wider text-[#0B0B0B]/50">{label}</div>
      <div className="text-2xl sm:text-3xl font-mono font-semibold mt-1.5">{value}</div>
      <div className="text-[11px] font-mono text-[#0B0B0B]/50 mt-1">No data yet</div></div>
  );

  return <div className="space-y-8 sm:space-y-10 max-w-6xl mx-auto pb-16">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
      <div><div className="text-xs font-mono uppercase tracking-wider text-[#0B0B0B]/50 mb-1.5">Projects / {project.name}</div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{project.name}</h1>
        <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-1">{project.environment} frontend monitoring</p></div>
      <div className="flex items-center gap-2">
        {project.url && <a href={project.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono border border-[#0B0B0B]/20 rounded-md">View Site <ExternalLink className="w-3.5 h-3.5" /></a>}
        <button type="button" onClick={() => onNavigate('settings')} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono bg-[#0B0B0B] text-[#F5F3EE] rounded-md"><Settings className="w-3.5 h-3.5" />Project Settings</button>
      </div>
    </div>
    <section className="border border-[#0B0B0B]/10 rounded-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#0B0B0B]/10">
      {metric('Responsive Health', project.responsiveHealth ?? '—')}
      {metric('Protected Viewports', viewports.length > 0 ? viewports.length : '—')}
      {metric('Issues', issues.length > 0 ? openIssues.length : '—')}
      {metric('Autofixes', autofixCount > 0 ? autofixCount : '—')}
    </section>
    <section className="space-y-4"><div><h2 className="text-lg font-semibold">Responsive Health</h2><p className="text-xs text-[#0B0B0B]/60 mt-0.5">Continuous synthetic layout verification matrix</p></div>
      <EmptyState title="No viewport data yet" description="Real viewport dimensions observed from your application will appear here." /></section>
    <section className="space-y-4"><div><h2 className="text-lg font-semibold">Recent Issues</h2><p className="text-xs text-[#0B0B0B]/60 mt-0.5">Active layout boundary and wrapping alerts</p></div>
      <EmptyState title="No responsive issues yet" description="Issues detected from real application traffic will appear here." /></section>
  </div>;
};
