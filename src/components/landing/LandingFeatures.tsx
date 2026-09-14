import React, { useState } from 'react';
import { 
  GitPullRequest, 
  Layers, 
  Wrench, 
  Check, 
  Copy, 
  Github,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { PageType } from '../../types';

interface LandingFeaturesProps {
  onNavigate: (page: PageType) => void;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({ onNavigate }) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const runtimeSnippet = `npm install @provenly/adaptive-react

// Add once at your application root
<AdaptiveProvider
  projectId="your-project-id"
  runtimeKey="adp_pk_..."
  apiBaseUrl="https://api.yourdomain.com"
  autoAdapt={true}
>`;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(runtimeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const features = [
    {
      icon: <Layers className="w-5 h-5 text-[#0B0B0B]" />,
      title: 'Observe real sessions',
      description: 'The runtime watches rendered DOM, CSSOM, routes, viewport changes, and mutations across real visitors.',
      detail: 'Heartbeats and bounded layout events appear in the project dashboard.'
    },
    {
      icon: <GitPullRequest className="w-5 h-5 text-[#0B0B0B]" />,
      title: 'AI-assisted decisions',
      description: 'Deterministic checks identify anomalies, then the server-side Gemini decision layer chooses whether a safe adaptation is warranted.',
      detail: 'Without a Gemini key, the runtime reports only and never pretends to autofix.'
    },
    {
      icon: <Wrench className="w-5 h-5 text-[#0B0B0B]" />,
      title: 'Verified session protection',
      description: 'A selected strategy is applied only to the affected visitor, measured immediately, and rolled back if the layout gets worse.',
      detail: 'Permanent source fixes remain under your team’s control.'
    }
  ];

  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-16">
      {/* 3 Core Pillars */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-mono uppercase tracking-widest text-[#0B0B0B]/50 mb-2">
            Engineered For Frontend Quality
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0B0B0B]">
            Responsive protection for every rendered page
          </h2>
          <p className="text-xs sm:text-sm text-[#0B0B0B]/70 mt-2">
            Install one small adapter, connect a project, and let the runtime surface the responsive incidents your users actually experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 bg-[#F5F3EE] border border-[#0B0B0B]/15 rounded-lg space-y-4 hover:border-[#0B0B0B]/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-md bg-[#0B0B0B]/5 border border-[#0B0B0B]/10 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-base font-semibold text-[#0B0B0B]">
                {feat.title}
              </h3>
              <p className="text-xs text-[#0B0B0B]/80 leading-relaxed">
                {feat.description}
              </p>
              <div className="pt-3 border-t border-[#0B0B0B]/10 text-[11px] font-mono text-[#0B0B0B]/60">
                {feat.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Runtime integration preview */}
      <div id="ci-cd" className="bg-[#0B0B0B] text-[#F5F3EE] rounded-xl p-6 sm:p-10 border border-[#0B0B0B]/20 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left info */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F5F3EE]/10 text-xs font-mono text-[#F5F3EE]">
              <Github className="w-3.5 h-3.5" />
              <span>Published runtime packages</span>
            </div>

            <h3 className="text-2xl font-semibold tracking-tight text-[#F5F3EE]">
              Connect your production website in minutes
            </h3>

            <p className="text-xs sm:text-sm text-[#F5F3EE]/70 leading-relaxed">
              The console gives you a project ID, public runtime key, and API origin. Install the adapter, deploy your site, and refresh Setup to see the first heartbeat.
            </p>

            <div className="space-y-2 text-xs font-mono text-[#F5F3EE]/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Framework-agnostic browser observer</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Real viewport and route telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified adaptation with rollback</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('docs')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5F3EE] text-[#0B0B0B] text-xs font-mono font-semibold rounded hover:bg-[#F5F3EE]/90 transition-colors"
              >
                <span>Read the setup guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

      {/* Right runtime integration code block */}
          <div className="lg:col-span-7 bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden shadow-inner font-mono text-xs">
            <div className="bg-[#21262d] px-4 py-2.5 border-b border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#8b949e] text-[11px]">
                <Github className="w-3.5 h-3.5 text-white" />
                <span>application-root.tsx</span>
              </div>
              <button
                type="button"
                onClick={handleCopyYaml}
                className="flex items-center gap-1.5 px-2 py-1 text-[11px] rounded bg-[#30363d] text-[#c9d1d9] hover:bg-[#383f47] transition-colors"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy snippet</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 text-[#c9d1d9] overflow-x-auto text-[11px] sm:text-xs leading-relaxed">
              <code>{runtimeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
