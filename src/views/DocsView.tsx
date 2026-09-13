import React, { useState } from 'react';
import { PageType, UserSession } from '../types';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingFooter } from '../components/landing/LandingFooter';
import { 
  Terminal, 
  Copy, 
  Check, 
  BookOpen, 
  Cpu, 
  Code2, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  ExternalLink,
  Layers,
  FileCode,
  Zap,
  Globe
} from 'lucide-react';

interface DocsViewProps {
  onNavigate: (page: PageType) => void;
  userSession: UserSession | null;
}

type DocSection = 
  | 'getting-started'
  | 'react-sdk'
  | 'cli-tool'
  | 'github-actions'
  | 'autofix-heuristics'
  | 'api-reference';

export const DocsView: React.FC<DocsViewProps> = ({
  onNavigate,
  userSession,
}) => {
  const [activeSection, setActiveSection] = useState<DocSection>('getting-started');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPkgManager, setSelectedPkgManager] = useState<'npm' | 'pnpm' | 'yarn' | 'bun'>('npm');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getInstallCmd = (pkg: string) => {
    switch (selectedPkgManager) {
      case 'npm': return `npm install ${pkg}`;
      case 'pnpm': return `pnpm add ${pkg}`;
      case 'yarn': return `yarn add ${pkg}`;
      case 'bun': return `bun add ${pkg}`;
    }
  };

  const navItems: { id: DocSection; title: string; category: string; icon: React.ReactNode }[] = [
    { id: 'getting-started', title: 'Getting Started', category: 'Overview', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'react-sdk', title: 'React / Next.js SDK', category: 'Runtime SDK', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'cli-tool', title: 'CLI Collision Scanner', category: 'Tooling', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'github-actions', title: 'CI/CD & GitHub Gating', category: 'Tooling', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'autofix-heuristics', title: 'Autofix CSS Heuristics', category: 'Core Engine', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'api-reference', title: 'API & Types Reference', category: 'Reference', icon: <FileCode className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F5F3EE] text-[#0B0B0B] flex flex-col font-sans selection:bg-[#0B0B0B] selection:text-[#F5F3EE] safe-top safe-bottom">
      {/* Public Header */}
      <LandingHeader
        onNavigate={onNavigate}
        userSession={userSession}
        onOpenGitHubAuth={() => onNavigate('login')}
        onOpenPricing={() => onNavigate('pricing')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Docs Breadcrumbs & Heading */}
        <div className="mb-8 pb-6 border-b border-[#0B0B0B]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0B0B0B]/50 mb-1">
              <button 
                type="button" 
                onClick={() => onNavigate('landing')}
                className="hover:text-[#0B0B0B] transition-colors"
              >
                Adaptive
              </button>
              <ChevronRight className="w-3 h-3" />
              <span>Documentation & SDK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0B]">
              Runtime SDK & Integration Guides
            </h1>
            <p className="text-xs sm:text-sm text-[#0B0B0B]/60 mt-1">
              Implement client-side viewport collision detection and continuous CI/CD regression gating.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="px-3 py-1.5 border border-[#0B0B0B]/20 rounded text-xs font-mono hover:bg-[#0B0B0B]/5 transition-colors"
            >
              View Pricing
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-3.5 py-1.5 bg-[#0B0B0B] text-[#F5F3EE] rounded text-xs font-mono font-medium hover:bg-[#0B0B0B]/85 transition-colors"
            >
              Get Free API Key
            </button>
          </div>
        </div>

        {/* Documentation Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3 border border-[#0B0B0B]/15 rounded-lg p-4 bg-[#F5F3EE] sticky top-20">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50 px-2 mb-3">
              Documentation Index
            </div>
            <nav className="space-y-1 font-mono text-xs">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-left ${
                    activeSection === item.id
                      ? 'bg-[#0B0B0B] text-[#F5F3EE] font-medium'
                      : 'text-[#0B0B0B]/70 hover:text-[#0B0B0B] hover:bg-[#0B0B0B]/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-4 border-t border-[#0B0B0B]/10 px-2 space-y-2">
              <div className="text-[10px] font-mono text-[#0B0B0B]/40 uppercase tracking-wider">
                Runtime contract
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#0B0B0B]/70">
                <span>SDK package</span>
                <span className="font-semibold text-[#0B0B0B]">See install guide</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#0B0B0B]/70">
                <span>CLI package</span>
                <span className="font-semibold text-[#0B0B0B]">See install guide</span>
              </div>
            </div>
          </aside>

          {/* Right Content Area */}
          <article className="lg:col-span-9 bg-[#F5F3EE] border border-[#0B0B0B]/15 rounded-lg p-6 sm:p-8 space-y-8 min-w-0">
            {/* Section 1: Getting Started */}
            {activeSection === 'getting-started' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                    Overview
                  </span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0B0B] mt-1">
                    Introduction to Adaptive
                  </h2>
                  <p className="text-sm text-[#0B0B0B]/70 mt-2 leading-relaxed">
                    Adaptive is a dedicated responsive observability suite. It detects unintended horizontal scrolling, rigid container collisions, and clipped typography across real viewport dimensions before your users encounter them.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-[#0B0B0B]/15 rounded-md bg-[#0B0B0B]/[0.02]">
                    <div className="font-mono text-xs font-semibold text-[#0B0B0B] mb-1 flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      <span>1. Pre-Deployment (CI/CD)</span>
                    </div>
                    <p className="text-xs text-[#0B0B0B]/65 leading-relaxed">
                      Run <code className="font-mono bg-[#0B0B0B]/5 px-1 rounded">@adaptive/cli</code> in your GitHub Pull Requests. Synthetically spins up headless browsers at 320px–1920px and fails builds with visual diffs if elements clip.
                    </p>
                  </div>

                  <div className="p-4 border border-[#0B0B0B]/15 rounded-md bg-[#0B0B0B]/[0.02]">
                    <div className="font-mono text-xs font-semibold text-[#0B0B0B] mb-1 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      <span>2. Post-Deployment (Runtime)</span>
                    </div>
                    <p className="text-xs text-[#0B0B0B]/65 leading-relaxed">
                      Wrap your application in <code className="font-mono bg-[#0B0B0B]/5 px-1 rounded">&lt;AdaptiveUI /&gt;</code>. A lightweight (1.8kB gzip) ResizeObserver automatically applies defensive layout fixes if edge collisions occur.
                    </p>
                  </div>
                </div>

                {/* Quick 2-Minute Setup */}
                <div className="border-t border-[#0B0B0B]/10 pt-6 space-y-4">
                  <h3 className="text-base font-semibold text-[#0B0B0B]">
                    Fast Track Installation
                  </h3>

                  {/* Package manager selector */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    {(['npm', 'pnpm', 'yarn', 'bun'] as const).map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setSelectedPkgManager(pm)}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          selectedPkgManager === pm
                            ? 'bg-[#0B0B0B] text-[#F5F3EE] font-medium'
                            : 'text-[#0B0B0B]/60 hover:text-[#0B0B0B] hover:bg-[#0B0B0B]/5'
                        }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>

                  <div className="relative group bg-[#0B0B0B] text-[#F5F3EE] rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <code>{getInstallCmd('@adaptive/react @adaptive/cli')}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(getInstallCmd('@adaptive/react @adaptive/cli'), 'quickstart')}
                      className="absolute right-3 top-3 p-1.5 text-[#F5F3EE]/60 hover:text-white bg-[#F5F3EE]/10 rounded hover:bg-[#F5F3EE]/20 transition-colors"
                      title="Copy command"
                    >
                      {copiedKey === 'quickstart' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: React SDK */}
            {activeSection === 'react-sdk' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                    SDK Integration
                  </span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0B0B] mt-1">
                    React & Next.js Observer Setup
                  </h2>
                  <p className="text-sm text-[#0B0B0B]/70 mt-2 leading-relaxed">
                    The React SDK injects a defensive bounding box observer into your root component tree. It operates with zero dependencies and executes in a separate microtask.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono font-semibold text-[#0B0B0B]">
                    1. Wrap your root application
                  </div>
                  <div className="relative bg-[#0B0B0B] text-[#F5F3EE] rounded-lg p-4 font-mono text-xs overflow-x-auto leading-relaxed">
                    <pre>{`// App.tsx or app/layout.tsx
import { AdaptiveUI } from '@adaptive/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdaptiveUI 
          projectId="proj_live_9481" 
          autofix={true}
          reportingUrl="https://api.adaptive.dev/v1/telemetry"
        >
          {children}
        </AdaptiveUI>
      </body>
    </html>
  );
}`}</pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`import { AdaptiveUI } from '@adaptive/react';`, 'code-wrap')}
                      className="absolute right-3 top-3 p-1.5 text-[#F5F3EE]/60 hover:text-white bg-[#F5F3EE]/10 rounded hover:bg-[#F5F3EE]/20 transition-colors"
                    >
                      {copiedKey === 'code-wrap' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono font-semibold text-[#0B0B0B]">
                    2. Use the Viewport Hook for adaptive rendering
                  </div>
                  <div className="relative bg-[#0B0B0B] text-[#F5F3EE] rounded-lg p-4 font-mono text-xs overflow-x-auto leading-relaxed">
                    <pre>{`import { useAdaptiveViewport } from '@adaptive/react';

export function NavigationBar() {
  const { width, isColliding, activeBreakpoint } = useAdaptiveViewport();

  return (
    <header className="flex justify-between items-center px-4 py-3">
      <Logo />
      {width < 640 ? <MobileMenuDrawer /> : <DesktopNavLinks />}
      {isColliding && (
        <span className="text-[10px] text-rose-500">Layout overflow auto-contained</span>
      )}
    </header>
  );
}`}</pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`const { width, isColliding } = useAdaptiveViewport();`, 'code-hook')}
                      className="absolute right-3 top-3 p-1.5 text-[#F5F3EE]/60 hover:text-white bg-[#F5F3EE]/10 rounded hover:bg-[#F5F3EE]/20 transition-colors"
                    >
                      {copiedKey === 'code-hook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: CLI Tool */}
            {activeSection === 'cli-tool' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                    Developer CLI
                  </span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0B0B] mt-1">
                    @adaptive/cli Collision Scanner
                  </h2>
                  <p className="text-sm text-[#0B0B0B]/70 mt-2 leading-relaxed">
                    Run local or CI layout checks directly from your terminal. Simulates DOM rendering against common breakpoints and outputs structured JSON or terminal tables.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono font-semibold text-[#0B0B0B]">
                    Run on localhost or preview URL:
                  </div>
                  <div className="relative bg-[#0B0B0B] text-[#F5F3EE] rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <code>npx @adaptive/cli audit http://localhost:3000 --viewports=320,375,768,1024</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('npx @adaptive/cli audit http://localhost:3000 --viewports=320,375,768,1024', 'cli-run')}
                      className="absolute right-3 top-3 p-1.5 text-[#F5F3EE]/60 hover:text-white bg-[#F5F3EE]/10 rounded hover:bg-[#F5F3EE]/20 transition-colors"
                    >
                      {copiedKey === 'cli-run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="border border-[#0B0B0B]/15 rounded-md p-4 bg-[#0B0B0B]/[0.02] space-y-2">
                  <div className="font-mono text-xs font-semibold text-[#0B0B0B]">CLI Flags Reference:</div>
                  <div className="space-y-1.5 text-xs font-mono text-[#0B0B0B]/70">
                    <div><span className="text-[#0B0B0B] font-bold">--threshold=&lt;px&gt;</span> : Minimum element collision distance before flagging (default: 12px)</div>
                    <div><span className="text-[#0B0B0B] font-bold">--ci</span> : Returns exit code 1 if any High severity viewport collision is detected</div>
                    <div><span className="text-[#0B0B0B] font-bold">--autofix-diff</span> : Emits suggested Tailwind and CSS property patches directly to stdout</div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: GitHub Actions */}
            {activeSection === 'github-actions' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                    Automation
                  </span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0B0B] mt-1">
                    GitHub Actions PR Gating
                  </h2>
                  <p className="text-sm text-[#0B0B0B]/70 mt-2 leading-relaxed">
                    Block regressions before they merge into main. Automatically comments on pull requests with annotated screenshots of clipped elements.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono text-[#0B0B0B]/70">
                    Add <code className="bg-[#0B0B0B]/5 px-1 rounded text-[#0B0B0B]">.github/workflows/adaptive.yml</code> to your repository:
                  </div>
                  <div className="relative bg-[#0B0B0B] text-[#F5F3EE] rounded-lg p-4 font-mono text-xs overflow-x-auto leading-relaxed">
                    <pre>{`name: Adaptive Viewport CI

on:
  pull_request:
    branches: [main]

jobs:
  viewport-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci

      - name: Build production bundle
        run: npm run build

      - name: Run Adaptive Layout Audit
        uses: adaptive-security/action@v2
        with:
          api-key: \${{ secrets.ADAPTIVE_API_KEY }}
          viewports: 'iphone-se,galaxy-s21,ipad-mini'
          fail-on-high: true`}</pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`uses: adaptive-security/action@v2`, 'github-yml')}
                      className="absolute right-3 top-3 p-1.5 text-[#F5F3EE]/60 hover:text-white bg-[#F5F3EE]/10 rounded hover:bg-[#F5F3EE]/20 transition-colors"
                    >
                      {copiedKey === 'github-yml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Autofix Heuristics */}
            {activeSection === 'autofix-heuristics' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                    Engine Architecture
                  </span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0B0B] mt-1">
                    Defensive CSS & Heuristics
                  </h2>
                  <p className="text-sm text-[#0B0B0B]/70 mt-2 leading-relaxed">
                    How the Adaptive engine prevents broken viewports without altering page semantics or breaking design intents.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="p-4 border border-[#0B0B0B]/15 rounded-md bg-[#F5F3EE]">
                    <div className="font-semibold text-[#0B0B0B] mb-1">Rule 1: Flexible Wrap Containment</div>
                    <div className="text-[#0B0B0B]/70 font-sans leading-relaxed">
                      Converts inflexible <code className="font-mono bg-[#0B0B0B]/5 px-1 rounded">flex-nowrap</code> containers to <code className="font-mono bg-[#0B0B0B]/5 px-1 rounded">flex-wrap</code> when child bounding rects exceed the parent offset width.
                    </div>
                  </div>

                  <div className="p-4 border border-[#0B0B0B]/15 rounded-md bg-[#F5F3EE]">
                    <div className="font-semibold text-[#0B0B0B] mb-1">Rule 2: Dynamic Min-Width Clamp</div>
                    <div className="text-[#0B0B0B]/70 font-sans leading-relaxed">
                      Replaces hardcoded pixel values (e.g. <code className="font-mono bg-[#0B0B0B]/5 px-1 rounded">min-width: 480px</code>) with <code className="font-mono bg-[#0B0B0B]/5 px-1 rounded">min(100%, 480px)</code>, preventing horizontal page explosion on mobile browsers.
                    </div>
                  </div>

                  <div className="p-4 border border-[#0B0B0B]/15 rounded-md bg-[#F5F3EE]">
                    <div className="font-semibold text-[#0B0B0B] mb-1">Opt-out attribute for intentional overflows</div>
                    <div className="text-[#0B0B0B]/70 font-sans leading-relaxed">
                      If you have an intentional horizontal scrolling gallery or chart, simply add <code className="font-mono bg-[#0B0B0B]/5 px-1 rounded">data-adaptive-ignore="true"</code> to prevent the observer from injecting wrapping fixes.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 6: API Reference */}
            {activeSection === 'api-reference' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0B0B0B]/50">
                    API Specification
                  </span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#0B0B0B] mt-1">
                    TypeScript Interfaces & Webhooks
                  </h2>
                  <p className="text-sm text-[#0B0B0B]/70 mt-2 leading-relaxed">
                    Complete type declarations for custom logging, incident reporting, and webhook consumption.
                  </p>
                </div>

                <div className="relative bg-[#0B0B0B] text-[#F5F3EE] rounded-lg p-4 font-mono text-xs overflow-x-auto leading-relaxed">
                  <pre>{`export interface ViewportCollisionEvent {
  id: string;
  timestamp: string;
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  element: {
    selector: string;
    computedWidth: number;
    parentWidth: number;
    overflowPx: number;
  };
  autofixApplied: boolean;
  fixType?: 'flex-wrap' | 'min-width-clamp' | 'overflow-wrap';
}`}</pre>
                </div>
              </div>
            )}

            {/* Call to action card at the bottom of docs */}
            <div className="mt-12 p-6 bg-[#0B0B0B] text-[#F5F3EE] rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-mono text-sm font-semibold">Ready to test in your project?</div>
                <div className="text-xs text-[#F5F3EE]/70 font-mono mt-0.5">
                  Start scanning your layouts free with GitHub authentication.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="px-3.5 py-2 border border-[#F5F3EE]/30 rounded text-xs font-mono hover:bg-[#F5F3EE]/10 transition-colors"
                >
                  View Plans
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 bg-[#F5F3EE] text-[#0B0B0B] rounded text-xs font-mono font-medium hover:bg-white transition-colors flex items-center gap-1.5"
                >
                  <span>Connect GitHub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* Public Footer */}
      <LandingFooter onNavigate={onNavigate} />

    </div>
  );
};
