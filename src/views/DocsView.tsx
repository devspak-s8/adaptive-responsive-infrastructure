import React, { useState } from 'react';
import { PageType, UserSession } from '../types';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingFooter } from '../components/landing/LandingFooter';
import { ArrowRight, Check, ChevronRight, Copy, ShieldCheck, Sparkles } from 'lucide-react';

interface DocsViewProps {
  onNavigate: (page: PageType) => void;
  userSession: UserSession | null;
}

type DocSection = 'getting-started' | 'react-sdk' | 'integrations' | 'deployment' | 'intelligence';

const codeClass = 'relative bg-[#0B0B0B] text-[#F5F3EE] rounded-lg p-4 font-mono text-xs overflow-x-auto leading-relaxed';

const snippets = {
  provider: [
    "'use client';",
    '',
    "import { AdaptiveProvider } from '@provenly/adaptive-react';",
    '',
    'export function Providers({ children }) {',
    '  return (',
    '    <AdaptiveProvider',
    '      projectId="your-project-id"',
    '      runtimeKey="adp_pk_..."',
    '      apiBaseUrl="https://api.yourdomain.com"',
    '      autoAdapt={true}',
    '    >',
    '      {children}',
    '    </AdaptiveProvider>',
    '  );',
    '}',
  ].join('\n'),
  browser: [
    "import { init } from '@provenly/adaptive-browser';",
    '',
    "init({ projectKey: 'adp_pk_...', apiBaseUrl: 'https://api.yourdomain.com', autoAdapt: true });",
  ].join('\n'),
};

export const DocsView: React.FC<DocsViewProps> = ({ onNavigate, userSession }) => {
  const [activeSection, setActiveSection] = useState<DocSection>('getting-started');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPkgManager, setSelectedPkgManager] = useState<'npm' | 'pnpm' | 'yarn' | 'bun'>('npm');

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 2000);
  };

  const installCommand = (pkg: string) => selectedPkgManager === 'pnpm'
    ? `pnpm add ${pkg}`
    : selectedPkgManager === 'yarn'
      ? `yarn add ${pkg}`
      : selectedPkgManager === 'bun'
        ? `bun add ${pkg}`
        : `npm install ${pkg}`;

  const navItems: { id: DocSection; title: string }[] = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'react-sdk', title: 'React / Next.js' },
    { id: 'integrations', title: 'Other Frameworks' },
    { id: 'deployment', title: 'Production Deployment' },
    { id: 'intelligence', title: 'Runtime Intelligence' },
  ];

  const heading = (eyebrow: string, title: string, description: string) => (
    <div>
      <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">{eyebrow}</span>
      <h2 className="text-xl sm:text-2xl font-semibold mt-1">{title}</h2>
      <p className="text-sm text-[#0B0B0B]/70 mt-2 leading-relaxed">{description}</p>
    </div>
  );

  const copyButton = (value: string, key: string) => (
    <button type="button" onClick={() => copyToClipboard(value, key)} className="absolute right-3 top-3 p-1.5 text-[#F5F3EE]/60 hover:text-white bg-[#F5F3EE]/10 rounded" title="Copy">
      {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F5F3EE] text-[#0B0B0B] flex flex-col font-sans selection:bg-[#0B0B0B] selection:text-[#F5F3EE] safe-top safe-bottom">
      <LandingHeader onNavigate={onNavigate} userSession={userSession} onOpenGitHubAuth={() => onNavigate('login')} onOpenPricing={() => onNavigate('pricing')} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 pb-6 border-b border-[#0B0B0B]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0B0B0B]/50 mb-1"><button type="button" onClick={() => onNavigate('landing')} className="hover:text-[#0B0B0B]">Adaptive</button><ChevronRight className="w-3 h-3" /><span>Documentation & SDK</span></div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Runtime SDK & Integration Guides</h1>
            <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-1">Connect a public runtime, observe real sessions, and safely adapt degraded layouts.</p>
          </div>
          <div className="flex items-center gap-3"><button type="button" onClick={() => onNavigate('pricing')} className="px-3 py-1.5 border border-[#0B0B0B]/20 rounded text-xs font-mono">View Pricing</button><button type="button" onClick={() => onNavigate('login')} className="px-3.5 py-1.5 bg-[#0B0B0B] text-[#F5F3EE] rounded text-xs font-mono">Create Project</button></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <aside className="lg:col-span-3 border border-[#0B0B0B]/15 rounded-lg p-4 bg-[#F5F3EE] sticky top-20">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50 px-2 mb-3">Documentation Index</div>
            <nav className="space-y-1 font-mono text-xs">{navItems.map((item) => <button key={item.id} type="button" onClick={() => setActiveSection(item.id)} className={`w-full px-3 py-2 rounded-md text-left ${activeSection === item.id ? 'bg-[#0B0B0B] text-[#F5F3EE] font-medium' : 'text-[#0B0B0B]/70 hover:text-[#0B0B0B] hover:bg-[#0B0B0B]/5'}`}>{item.title}</button>)}</nav>
            <div className="mt-8 pt-4 border-t border-[#0B0B0B]/10 px-2"><div className="text-[10px] font-mono text-[#0B0B0B]/40 uppercase tracking-wider">Published packages</div><div className="mt-2 text-[11px] font-mono">@provenly/adaptive-*</div><div className="text-[11px] font-mono text-[#0B0B0B]/50">v0.1.0</div></div>
          </aside>

          <article className="lg:col-span-9 bg-[#F5F3EE] border border-[#0B0B0B]/15 rounded-lg p-6 sm:p-8 space-y-8 min-w-0">
            {activeSection === 'getting-started' && <div className="space-y-6">
              {heading('Overview', 'Start protecting a real website', 'Adaptive runs in the browser after your page renders. The same observer works with React, Vue, Svelte, Angular, Astro, and server-rendered HTML.')}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="p-4 border border-[#0B0B0B]/15 rounded-md"><b className="font-mono text-xs">1. Create a project</b><p className="text-xs text-[#0B0B0B]/65 mt-1">Sign in with GitHub, add the project name, production URL, and environment. Setup creates a public runtime key.</p></div><div className="p-4 border border-[#0B0B0B]/15 rounded-md"><b className="font-mono text-xs">2. Install and deploy</b><p className="text-xs text-[#0B0B0B]/65 mt-1">Install an adapter, copy the project snippet, deploy the website, and refresh Setup until the first heartbeat is received.</p></div></div>
              <div className="border-t border-[#0B0B0B]/10 pt-6 space-y-4"><h3 className="text-base font-semibold">Install the published React package</h3><div className="flex items-center gap-2 font-mono text-xs">{(['npm', 'pnpm', 'yarn', 'bun'] as const).map((pm) => <button key={pm} type="button" onClick={() => setSelectedPkgManager(pm)} className={`px-2.5 py-1 rounded ${selectedPkgManager === pm ? 'bg-[#0B0B0B] text-[#F5F3EE]' : 'text-[#0B0B0B]/60'}`}>{pm}</button>)}</div><div className={codeClass}><code>{installCommand('@provenly/adaptive-react')}</code>{copyButton(installCommand('@provenly/adaptive-react'), 'install')}</div><p className="text-xs text-[#0B0B0B]/60">For plain HTML, Astro, WordPress, Shopify, Django, Laravel, Rails, or other browser-rendered apps, use <code>@provenly/adaptive-browser</code>.</p></div>
            </div>}

            {activeSection === 'react-sdk' && <div className="space-y-6">
              {heading('React / Next.js', 'Add the provider once at the app root', 'The provider starts the shared runtime. It observes rendered DOM/CSSOM, route changes, viewport changes, and layout mutations.')}
              <div className={codeClass}><pre>{snippets.provider}</pre>{copyButton(snippets.provider, 'provider')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"><div className="border border-[#0B0B0B]/15 rounded-md p-3"><b>Observe</b><p className="mt-1 text-[#0B0B0B]/60">Heartbeat, navigation, DOM/CSS changes, and viewport state.</p></div><div className="border border-[#0B0B0B]/15 rounded-md p-3"><b>Decide</b><p className="mt-1 text-[#0B0B0B]/60">The API sends new anomalies to Gemini when configured.</p></div><div className="border border-[#0B0B0B]/15 rounded-md p-3"><b>Protect</b><p className="mt-1 text-[#0B0B0B]/60">A safe strategy is verified and rolled back if it worsens layout.</p></div></div>
            </div>}

            {activeSection === 'integrations' && <div className="space-y-6">
              {heading('Integrations', 'Use the adapter for your stack', 'Adapters only connect framework lifecycle events. The intelligence engine remains in @provenly/adaptive-runtime.')}
              <div className="space-y-3 text-sm"><div className="border border-[#0B0B0B]/15 rounded-md p-4"><b>Vue / Nuxt</b><code className="block mt-2 text-xs font-mono">npm install @provenly/adaptive-vue</code><code className="block mt-1 text-xs font-mono text-[#0B0B0B]/65">useAdaptiveRuntime(options)</code></div><div className="border border-[#0B0B0B]/15 rounded-md p-4"><b>Svelte / SvelteKit</b><code className="block mt-2 text-xs font-mono">npm install @provenly/adaptive-svelte</code><code className="block mt-1 text-xs font-mono text-[#0B0B0B]/65">use:adaptiveRuntime={'{runtime}'}</code></div><div className="border border-[#0B0B0B]/15 rounded-md p-4"><b>Angular</b><code className="block mt-2 text-xs font-mono">npm install @provenly/adaptive-angular</code><code className="block mt-1 text-xs font-mono text-[#0B0B0B]/65">runtimeService.start(options)</code></div><div className="border border-[#0B0B0B]/15 rounded-md p-4"><b>Browser / Astro / server-rendered sites</b><code className="block mt-2 text-xs font-mono">npm install @provenly/adaptive-browser</code><pre className="mt-1 text-xs font-mono text-[#0B0B0B]/65">{snippets.browser}</pre></div></div>
            </div>}

            {activeSection === 'deployment' && <div className="space-y-6">
              {heading('Production', 'Connect your production site', 'The Adaptive API is the service that receives runtime heartbeats and layout events. Your project’s Setup & SDK page supplies the correct public API origin and runtime key.')}
              <ol className="list-decimal pl-5 space-y-2 text-sm text-[#0B0B0B]/75"><li>Create a project with the real production URL and environment.</li><li>Copy the project ID, public runtime key, and API origin from <b>Setup &amp; SDK</b>.</li><li>Install the adapter for your stack and add it once at the application root.</li><li>Deploy the website over HTTPS, then refresh Setup until the first heartbeat is visible.</li><li>Use the dashboard to review detected issues, adaptations, verification, and rollback events.</li></ol>
              <div className="p-4 border border-emerald-700/20 bg-emerald-700/5 rounded-md text-xs text-[#0B0B0B]/70"><b>What you paste into your app:</b> only the project ID, the <code>adp_pk_...</code> public runtime key, and the API origin shown for that project.</div>
            </div>}

            {activeSection === 'intelligence' && <div className="space-y-6">
              {heading('Engine', 'How detection and AI protection work', 'Deterministic checks identify meaningful layout signals; Gemini is the decision layer, not a replacement for safety validation.')}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div className="border border-[#0B0B0B]/15 rounded-md p-4"><ShieldCheck className="w-4 h-4 mb-2" /><b>Observe and compare</b><p className="mt-1 text-[#0B0B0B]/60">The runtime tracks viewport, DOM geometry, CSS properties, route, mutations, overflow, wrapping, and collisions.</p></div><div className="border border-[#0B0B0B]/15 rounded-md p-4"><Sparkles className="w-4 h-4 mb-2" /><b>Analyze and adapt</b><p className="mt-1 text-[#0B0B0B]/60">Gemini receives bounded context and may choose one allowlisted strategy for the affected element.</p></div></div>
              <div className="border border-[#0B0B0B]/15 rounded-md p-4 text-sm"><b>Without a Gemini key</b><p className="mt-1 text-[#0B0B0B]/60">The runtime still reports issues and heartbeats. The API returns <code>AI_NOT_CONFIGURED</code> and does not pretend to apply an intelligent fix.</p></div><div className="border border-[#0B0B0B]/15 rounded-md p-4 text-sm"><b>Verification and rollback</b><p className="mt-1 text-[#0B0B0B]/60">Every adaptation is visitor-scoped. The runtime measures the result immediately and restores the previous style if the layout does not improve.</p></div>
            </div>}

            <div className="mt-12 p-6 bg-[#0B0B0B] text-[#F5F3EE] rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4"><div><div className="font-mono text-sm font-semibold">Ready to connect a project?</div><div className="text-xs text-[#F5F3EE]/70 font-mono mt-0.5">Create a project, copy its runtime key, and deploy the SDK to your real website.</div></div><div className="flex items-center gap-3"><button type="button" onClick={() => onNavigate('pricing')} className="px-3.5 py-2 border border-[#F5F3EE]/30 rounded text-xs font-mono">View Plans</button><button type="button" onClick={() => onNavigate('login')} className="px-4 py-2 bg-[#F5F3EE] text-[#0B0B0B] rounded text-xs font-mono flex items-center gap-1.5">Connect GitHub <ArrowRight className="w-3.5 h-3.5" /></button></div></div>
          </article>
        </div>
      </main>
      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
};
