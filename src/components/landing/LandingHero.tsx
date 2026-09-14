import React, { useState } from 'react';
import { Github, Copy, Check } from 'lucide-react';
import { PageType } from '../../types';

interface LandingHeroProps {
  onNavigate: (page: PageType) => void;
  onOpenGitHubAuth: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onNavigate,
  onOpenGitHubAuth,
}) => {
  const [copied, setCopied] = useState(false);
  const cliCommand = 'npx @provenly/adaptive-cli audit --all-viewports';

  const handleCopy = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="pt-12 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#0B0B0B] max-w-4xl mx-auto leading-[1.12]">
        Catch broken mobile viewports before your customers do.
      </h1>

      {/* Sub-headline */}
      <p className="text-base sm:text-lg text-[#0B0B0B]/70 max-w-2xl mx-auto mt-5 sm:mt-6 leading-relaxed">
        Automated synthetic layout collision detection, Git regression gates, and instant CSS autofix for high-velocity frontend engineering teams.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
        <button
          type="button"
          onClick={onOpenGitHubAuth}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#0B0B0B] text-[#F5F3EE] font-mono text-xs font-semibold rounded-md hover:bg-[#0B0B0B]/85 transition-all shadow-md min-h-[44px]"
        >
          <Github className="w-4 h-4" />
          <span>Sign in with GitHub</span>
        </button>
      </div>

      {/* Copyable Quickstart Command */}
      <div className="mt-8 inline-flex items-center gap-3 bg-[#0B0B0B] text-[#F5F3EE] px-4 py-2 rounded-md font-mono text-xs border border-[#0B0B0B]/20 shadow-xs max-w-full overflow-x-auto">
        <span className="text-[#F5F3EE]/40">$</span>
        <code className="text-[#F5F3EE] select-all whitespace-nowrap">{cliCommand}</code>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy command"
          aria-label="Copy CLI command"
          className="p-1 hover:bg-[#F5F3EE]/10 rounded text-[#F5F3EE]/70 hover:text-[#F5F3EE] transition-colors ml-1"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Trust & Spec Markers */}
      <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#0B0B0B]/10 pt-8 text-left font-mono">
        <div className="p-3">
          <div className="text-xl sm:text-2xl font-bold text-[#0B0B0B]">Any</div>
          <div className="text-xs text-[#0B0B0B]/60 mt-0.5">Viewport dimensions supported</div>
        </div>
        <div className="p-3">
          <div className="text-xl sm:text-2xl font-bold text-[#0B0B0B]">Live</div>
          <div className="text-xs text-[#0B0B0B]/60 mt-0.5">Runtime viewport signals</div>
        </div>
        <div className="p-3">
          <div className="text-xl sm:text-2xl font-bold text-[#0B0B0B]">Safe</div>
          <div className="text-xs text-[#0B0B0B]/60 mt-0.5">Verified rollback workflow</div>
        </div>
        <div className="p-3">
          <div className="text-xl sm:text-2xl font-bold text-[#0B0B0B]">CI/CD</div>
          <div className="text-xs text-[#0B0B0B]/60 mt-0.5">GitHub Action native status</div>
        </div>
      </div>
    </section>
  );
};
