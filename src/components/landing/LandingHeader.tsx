import React, { useState } from 'react';
import { PageType, UserSession } from '../../types';
import { Github, Menu, X, LayoutDashboard } from 'lucide-react';

interface LandingHeaderProps {
  onNavigate: (page: PageType) => void;
  userSession?: UserSession | null;
  onOpenGitHubAuth: () => void;
  onOpenPricing?: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onNavigate,
  userSession,
  onOpenGitHubAuth,
  onOpenPricing,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGoPricing = () => {
    if (onOpenPricing) {
      onOpenPricing();
    } else {
      onNavigate('pricing');
    }
  };

  return (
    <header className="w-full border-b border-[#0B0B0B]/10 bg-[#F5F3EE]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 group text-left"
        >
          <div className="w-7 h-7 border border-[#0B0B0B] flex items-center justify-center rounded-[4px] bg-[#0B0B0B]/5 group-hover:bg-[#0B0B0B] group-hover:text-[#F5F3EE] transition-all">
            <div className="w-3 h-3 border border-current"></div>
          </div>
          <div>
            <span className="font-mono text-sm tracking-widest uppercase font-semibold text-[#0B0B0B]">
              ADAPTIVE
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-[#0B0B0B]/50 uppercase tracking-wider">
              Layout Observability
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links: ONLY Pricing, Docs */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono text-[#0B0B0B]/70">
          <button
            type="button"
            onClick={handleGoPricing}
            className="hover:text-[#0B0B0B] transition-colors"
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => onNavigate('docs')}
            className="hover:text-[#0B0B0B] transition-colors"
          >
            Docs
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {userSession?.isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#0B0B0B]/15 bg-[#0B0B0B]/5 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-[#0B0B0B]"></span>
                <span className="text-[#0B0B0B] font-semibold">@{userSession.githubLogin}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('overview')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-medium bg-[#0B0B0B] text-[#F5F3EE] rounded-md hover:bg-[#0B0B0B]/85 transition-colors shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Console</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 text-xs font-mono text-[#0B0B0B] hover:text-[#0B0B0B]/70 transition-colors"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={onOpenGitHubAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-medium bg-[#0B0B0B] text-[#F5F3EE] hover:bg-[#0B0B0B]/85 rounded-md transition-colors shadow-xs"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Sign in with GitHub</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile menu toggle button */}
        <div className="sm:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#0B0B0B] rounded hover:bg-[#0B0B0B]/5"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu: ONLY Pricing, Docs & Auth */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-[#0B0B0B]/10 bg-[#F5F3EE] px-4 py-4 space-y-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleGoPricing();
            }}
            className="block w-full text-left py-2 text-[#0B0B0B]/80 hover:text-[#0B0B0B]"
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('docs');
            }}
            className="block w-full text-left py-2 text-[#0B0B0B]/80 hover:text-[#0B0B0B]"
          >
            Docs
          </button>
          <div className="pt-2 border-t border-[#0B0B0B]/10 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenGitHubAuth();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0B0B0B] text-[#F5F3EE] rounded text-xs font-mono"
            >
              <Github className="w-4 h-4" />
              <span>Continue with GitHub</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('login');
              }}
              className="w-full py-2.5 border border-[#0B0B0B]/20 rounded text-xs font-mono text-center text-[#0B0B0B]"
            >
              Sign In (Email)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
