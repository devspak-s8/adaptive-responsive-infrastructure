import React, { useCallback, useEffect, useState } from 'react';
import { Check, CheckCircle2, Copy, RefreshCw } from 'lucide-react';
import type { ProjectItem } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { fetchRuntimeKey, type RuntimeKeyResponse } from '../services/runtime';

interface SetupViewProps { project: ProjectItem | null }

export const SetupView: React.FC<SetupViewProps> = ({ project }) => {
  const [runtime, setRuntime] = useState<RuntimeKeyResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(project));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const loadRuntime = useCallback(async () => {
    if (!project) return;
    try {
      const payload = await fetchRuntimeKey(project.id);
      setRuntime(payload);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Runtime setup is unavailable.');
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    setRuntime(null);
    setLoading(Boolean(project));
    if (!project) return;
    void loadRuntime();
  }, [project?.id, loadRuntime]);

  if (!project) {
    return <div className="max-w-4xl mx-auto pb-16"><EmptyState title="No project selected"
      description="Create a project before installing and connecting the runtime." /></div>;
  }

  const installCommand = 'npm install @provenly/react';
  const integrationCode = runtime
    ? `import { AdaptiveProvider } from '@provenly/react';

export default function App({ children }) {
  return (
    <AdaptiveProvider
      projectId="${runtime.projectId}"
      runtimeKey="${runtime.runtimeKey}"
      apiBaseUrl="${runtime.apiBaseUrl}"
    >
      {children}
    </AdaptiveProvider>
  );
}`
    : 'Loading project runtime configuration...';

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setError('Copy failed. Select the code manually instead.');
    }
  };

  return <div className="space-y-8 max-w-4xl mx-auto pb-16">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">{project.name} / Setup</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Connect the Adaptive runtime</h1>
        <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-1">Install the SDK once, then let this project report real viewport and layout events.</p>
      </div>
      <button type="button" onClick={() => void loadRuntime()} disabled={loading} className="inline-flex items-center justify-center gap-2 self-start px-3 py-2 border border-[#0B0B0B]/15 rounded-md text-xs font-mono hover:bg-[#0B0B0B]/[0.04] disabled:opacity-50">
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
      </button>
    </div>

    {error && <div role="alert" className="rounded-md border border-[#0B0B0B]/20 bg-[#0B0B0B]/[0.03] px-4 py-3 text-sm text-[#0B0B0B]/75">{error}</div>}

    <section className="rounded-md border border-[#0B0B0B]/15 bg-[#0B0B0B] p-5 sm:p-6 text-[#F5F3EE]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#F5F3EE]/45">Connection status</p>
          <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
            <span className={`h-2 w-2 rounded-full ${runtime?.lastHeartbeatAt ? 'bg-emerald-300' : 'bg-amber-300'}`} />
            {runtime?.lastHeartbeatAt ? 'Connected' : 'Waiting for first connection'}
          </div>
        </div>
        <div className="text-xs font-mono text-[#F5F3EE]/55 sm:text-right">
          <p>Project ID: {project.id}</p>
          {runtime?.lastHeartbeatAt && <p className="mt-1">Last heartbeat: {new Date(runtime.lastHeartbeatAt).toLocaleString()}</p>}
        </div>
      </div>
    </section>

    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div><div className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">1 / Install package</div><p className="mt-1 text-sm text-[#0B0B0B]/60">Add the runtime to the application that owns this project.</p></div>
        <button type="button" onClick={() => void copy(installCommand, 'install')} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-mono text-[#0B0B0B]/65 hover:text-[#0B0B0B]">{copied === 'install' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === 'install' ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-[#0B0B0B] p-4 font-mono text-xs text-[#F5F3EE]">{installCommand}</pre>
    </section>

    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div><div className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">2 / Add the provider</div><p className="mt-1 text-sm text-[#0B0B0B]/60">Wrap your app once. The runtime key is public and scoped to this project.</p></div>
        <button type="button" onClick={() => void copy(integrationCode, 'integration')} disabled={!runtime} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-mono text-[#0B0B0B]/65 hover:text-[#0B0B0B] disabled:opacity-40">{copied === 'integration' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === 'integration' ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="max-h-[420px] overflow-auto rounded-md bg-[#0B0B0B] p-4 font-mono text-xs leading-relaxed text-[#F5F3EE]">{integrationCode}</pre>
    </section>

    <section className="space-y-3 border-t border-[#0B0B0B]/10 pt-5">
      <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">3 / Verify</div>
      <div className="flex items-start gap-3 rounded-md border border-[#0B0B0B]/10 p-4">
        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${runtime?.lastHeartbeatAt ? 'text-emerald-700' : 'text-[#0B0B0B]/30'}`} />
        <div><p className="text-sm font-medium">{runtime?.lastHeartbeatAt ? 'Runtime heartbeat received.' : 'Deploy your application and open the production URL.'}</p><p className="mt-1 text-xs text-[#0B0B0B]/60">The API records a heartbeat when the SDK loads, the page becomes visible, or the route changes. Use Refresh after deploying to check again.</p></div>
      </div>
    </section>
  </div>;
};
