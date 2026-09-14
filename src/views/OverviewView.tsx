import React from 'react';
import { ExternalLink, Settings } from 'lucide-react';
import { AutofixRecord, PageType, ProjectItem, ResponsiveIssue, ViewportItem } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { CreateProjectForm } from '../components/CreateProjectForm';

interface OverviewViewProps {
  project: ProjectItem | null;
  viewports: ViewportItem[];
  issues: ResponsiveIssue[];
  autofixCount: number;
  autofixes: AutofixRecord[];
  onNavigate: (page: PageType) => void;
  onCreateProject: (name: string, environment: ProjectItem['environment'], url: string) => Promise<boolean | string> | boolean | string;
  onSelectIssue: (issue: ResponsiveIssue) => void;
  onSelectViewportInLab: (viewport: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ project, viewports, issues, autofixCount, autofixes, onNavigate, onCreateProject, onSelectIssue }) => {
  if (!project) {
    return <div className="max-w-6xl mx-auto pb-16 pt-2 space-y-5">
      <EmptyState title="No projects yet"
        description="Create your first project to start monitoring how your interface behaves across real-world viewports." />
      <section className="border border-[#0B0B0B]/10 rounded-md bg-[#F5F3EE] p-5 sm:p-7 max-w-2xl">
        <div className="mb-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">First project</div>
          <h2 className="text-lg sm:text-xl font-semibold mt-1">Connect an application</h2>
          <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-1.5 leading-relaxed">
            Add the application you want Adaptive to monitor. You can add more projects later.
          </p>
        </div>
        <CreateProjectForm onSubmit={onCreateProject} submitLabel="Create first project" />
      </section>
    </div>;
  }

  const openIssues = issues.filter((issue) => issue.status === 'Open');
  const metric = (label: string, value: React.ReactNode) => (
    <div className="p-4 sm:p-5"><div className="text-xs font-mono uppercase tracking-wider text-[#0B0B0B]/50">{label}</div>
      <div className="text-2xl sm:text-3xl font-mono font-semibold mt-1.5">{value}</div>
      <div className="text-[11px] font-mono text-[#0B0B0B]/50 mt-1">{project?.runtimeConnected ? 'Live runtime data' : 'Waiting for runtime'}</div></div>
  );

  return <div className="space-y-8 sm:space-y-10 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
      <div><div className="text-xs font-mono uppercase tracking-wider text-[#0B0B0B]/50 mb-1.5">Projects / {project.name}</div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{project.name}</h1>
        <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-1">{project.environment} frontend monitoring</p></div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onNavigate('setup')} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono border border-[#0B0B0B]/20 rounded-md hover:bg-[#0B0B0B]/[0.04]">{project.runtimeConnected ? 'Runtime setup' : 'Connect SDK'}</button>
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
    <section className="space-y-4"><div><h2 className="text-lg font-semibold">Responsive Health</h2><p className="text-xs text-[#0B0B0B]/60 mt-0.5">Viewport dimensions observed from real application traffic</p></div>
      {viewports.length === 0 ? <EmptyState title="No viewport data yet" description="Open the production URL with the Adaptive runtime installed to start collecting dimensions." /> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{viewports.map((viewport) => <button type="button" key={viewport.id} onClick={() => onNavigate('viewport-lab')} className="text-left border border-[#0B0B0B]/10 rounded-md bg-[#F5F3EE] p-4 hover:border-[#0B0B0B]/30 transition-colors"><div className="flex items-center justify-between gap-3"><span className="font-mono text-sm font-semibold">{viewport.dimensions}</span><span className="text-[10px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">{viewport.deviceType}</span></div><div className="mt-3 text-xs text-[#0B0B0B]/60">{viewport.issuesCount ? `${viewport.issuesCount} open issue${viewport.issuesCount === 1 ? '' : 's'}` : 'No open issues'}</div><div className="mt-1 text-[11px] font-mono text-[#0B0B0B]/45">{new Date(viewport.lastChecked).toLocaleString()}</div></button>)}</div>}
    </section>
    <section className="space-y-4"><div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Recent Issues</h2><p className="text-xs text-[#0B0B0B]/60 mt-0.5">Active layout boundary and wrapping alerts from visitors</p></div>{issues.length > 0 && <button type="button" onClick={() => onNavigate('issues')} className="text-xs font-mono underline underline-offset-4">View all</button>}</div>
      {issues.length === 0 ? <EmptyState title="No responsive issues yet" description="Issues detected from real application traffic will appear here." /> : <div className="border border-[#0B0B0B]/10 rounded-md divide-y divide-[#0B0B0B]/10 bg-[#F5F3EE]">{issues.slice(0, 5).map((issue) => <button type="button" key={issue.id} onClick={() => onSelectIssue(issue)} className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-[#0B0B0B]/[0.03]"><div><div className="font-medium text-sm">{issue.title}</div><div className="text-xs font-mono text-[#0B0B0B]/55 mt-1">{issue.route} · {issue.viewport} · {issue.element}</div></div><span className="text-[10px] font-mono uppercase tracking-wider text-[#0B0B0B]/55">{issue.status}</span></button>)}</div>}
    </section>
    <section className="space-y-4"><div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Runtime adaptations</h2><p className="text-xs text-[#0B0B0B]/60 mt-0.5">Scoped fixes verified in visitor sessions</p></div>{autofixes.length > 0 && <button type="button" onClick={() => onNavigate('autofix')} className="text-xs font-mono underline underline-offset-4">Open Autofix</button>}</div>
      {autofixes.length === 0 ? <EmptyState title="No runtime adaptations yet" description="Verified adaptations will appear here after the runtime safely resolves an issue." /> : <div className="border border-[#0B0B0B]/10 rounded-md divide-y divide-[#0B0B0B]/10 bg-[#F5F3EE]">{autofixes.slice(0, 4).map((fix) => <div key={fix.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><div className="font-medium text-sm">{fix.fix}</div><div className="text-xs font-mono text-[#0B0B0B]/55 mt-1">{fix.route} · {fix.viewport}</div></div><span className="text-[10px] font-mono uppercase tracking-wider text-[#0B0B0B]/55">{fix.result}</span></div>)}</div>}
    </section>
  </div>;
};
