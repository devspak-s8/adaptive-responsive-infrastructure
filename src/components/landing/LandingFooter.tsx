import React from 'react';
import { PageType } from '../../types';
import { Github, ExternalLink } from 'lucide-react';

interface LandingFooterProps {
  onNavigate: (page: PageType) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-[#0B0B0B]/10 bg-[#F5F3EE] py-12 px-4 sm:px-6 lg:px-8 font-mono text-xs text-[#0B0B0B]/70">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-baseline justify-between gap-8">
        {/* Brand & Mission */}
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border border-[#0B0B0B] flex items-center justify-center rounded-[3px] bg-[#0B0B0B]/5">
              <div className="w-2 h-2 border border-[#0B0B0B]"></div>
            </div>
            <span className="font-mono text-sm tracking-widest uppercase font-semibold text-[#0B0B0B]">
              ADAPTIVE
            </span>
          </div>
          <p className="text-[11px] text-[#0B0B0B]/60 leading-normal">
            Autonomous responsive layout monitoring, real-time collision detection, and zero-regression runtime repair.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-[#0B0B0B]/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All systems operational • v2.4.1</span>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[#0B0B0B] uppercase tracking-wider">
              Console
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('overview')}
                  className="hover:text-[#0B0B0B] transition-colors"
                >
                  Dashboard Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('viewport-lab')}
                  className="hover:text-[#0B0B0B] transition-colors"
                >
                  Viewport Lab
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('issues')}
                  className="hover:text-[#0B0B0B] transition-colors"
                >
                  Detected Issues
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('autofix')}
                  className="hover:text-[#0B0B0B] transition-colors"
                >
                  Autofix Engine
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[#0B0B0B] uppercase tracking-wider">
              Resources
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('docs')}
                  className="hover:text-[#0B0B0B] transition-colors"
                >
                  Documentation & SDK
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="hover:text-[#0B0B0B] transition-colors"
                >
                  Pricing Plans
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('deployments')}
                  className="hover:text-[#0B0B0B] transition-colors"
                >
                  CI/CD Deployments
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('activity')}
                  className="hover:text-[#0B0B0B] transition-colors"
                >
                  Audit Activity Stream
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-[#0B0B0B] uppercase tracking-wider">
              Account
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="hover:text-[#0B0B0B] transition-colors"
                >
                  Sign In with GitHub
                </button>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#0B0B0B] transition-colors"
                >
                  <Github className="w-3 h-3" />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-[#0B0B0B]/10 flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#0B0B0B]/40 gap-4">
        <div>© 2026 Adaptive Observability Inc. Licensed under Apache 2.0.</div>
        <div className="flex items-center gap-4">
          <span>Telemetry Opt-in</span>
          <span>•</span>
          <span>Free plan available</span>
        </div>
      </div>
    </footer>
  );
};
