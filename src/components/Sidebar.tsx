import React, { useEffect, useState } from 'react';
import { 
  LayoutGrid, 
  FolderKanban, 
  AlertCircle, 
  Wrench, 
  GitCommit, 
  Activity, 
  Settings, 
  BookOpen, 
  Sliders, 
  Eye, 
  Terminal, 
  LogOut,
  X,
  Globe,
  Github,
  Zap,
  CreditCard,
  LoaderCircle,
} from 'lucide-react';
import { PageType, UserSession } from '../types';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  openIssuesCount: number;
  autofixActive: boolean;
  onShowLogin: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  userSession?: UserSession | null;
  isLoading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  openIssuesCount,
  autofixActive,
  onShowLogin,
  isMobileOpen = false,
  onCloseMobile,
  userSession,
  isLoading = false,
}) => {
  const [isDrawerRendered, setIsDrawerRendered] = useState(isMobileOpen);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);

  useEffect(() => {
    if (isMobileOpen) {
      setIsDrawerRendered(true);
      setIsDrawerClosing(false);
      return;
    }
    if (!isDrawerRendered) return;
    setIsDrawerClosing(true);
    const timeout = window.setTimeout(() => {
      setIsDrawerRendered(false);
      setIsDrawerClosing(false);
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [isMobileOpen, isDrawerRendered]);

  // Handle ESC key to close mobile navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    if (isMobileOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when mobile drawer is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileOpen, onCloseMobile]);

  const handleItemClick = (page: PageType) => {
    onNavigate(page);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems: { id: PageType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { 
      id: 'issues', 
      label: 'Issues', 
      icon: <AlertCircle className="w-4 h-4" />, 
      badge: openIssuesCount > 0 ? String(openIssuesCount) : undefined 
    },
    { 
      id: 'autofix', 
      label: 'Autofix', 
      icon: <Wrench className="w-4 h-4" />, 
      badge: autofixActive ? 'ON' : undefined 
    },
    { id: 'viewport-lab', label: 'Viewport Lab', icon: <Eye className="w-4 h-4" /> },
    { id: 'deployments', label: 'Deployments', icon: <GitCommit className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 select-none safe-top safe-bottom">
      {/* Top section: Wordmark, Status & Navigation */}
      <div className="flex flex-col gap-6">
        {/* Brand / Logo + Mobile Close */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button 
            type="button"
            onClick={() => handleItemClick('overview')}
            className="flex items-center gap-2.5 text-left group"
          >
            {/* Minimal geometric monochrome icon */}
            <div className="w-6 h-6 border border-[#F5F3EE]/40 flex items-center justify-center rounded-[4px] bg-[#F5F3EE]/5 group-hover:border-[#F5F3EE] transition-colors flex-shrink-0">
              <div className="w-2.5 h-2.5 border border-[#F5F3EE]/90"></div>
            </div>
            <div>
              <span className="font-mono text-sm tracking-widest uppercase font-semibold text-[#F5F3EE]">
                ADAPTIVE
              </span>
              <span className="block text-[10px] text-[#F5F3EE]/40 font-mono tracking-tight leading-none mt-0.5">
                RUNTIME
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Quick status pill */}
            <div 
              title="Runtime status"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#F5F3EE]/15 bg-[#F5F3EE]/5 text-[10px] font-mono text-[#F5F3EE]/70"
            >
              {isLoading ? <LoaderCircle className="w-3 h-3 animate-spin text-[#F5F3EE]/80" aria-hidden="true" /> : <span className="w-1.5 h-1.5 rounded-full border border-[#F5F3EE]/50"></span>}
              <span>{isLoading ? 'SYNCING' : 'NO DATA'}</span>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="lg:hidden p-1.5 rounded text-[#F5F3EE]/60 hover:text-[#F5F3EE] hover:bg-[#F5F3EE]/10 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav aria-label="Main Navigation" className="flex flex-col gap-1">
          <div className="px-2 pb-1 text-[11px] font-mono uppercase tracking-wider text-[#F5F3EE]/40">
            Platform
          </div>
          {navItems.map((item) => {
            const isSelected = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-2 text-[13px] rounded-md transition-all duration-150 text-left min-h-[44px] sm:min-h-[38px] ${
                  isSelected
                    ? 'bg-[#F5F3EE]/15 text-[#F5F3EE] font-medium border border-[#F5F3EE]/20 shadow-xs'
                    : 'text-[#F5F3EE]/70 hover:text-[#F5F3EE] hover:bg-[#F5F3EE]/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isSelected ? 'text-[#F5F3EE]' : 'text-[#F5F3EE]/60'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      isSelected
                        ? 'bg-[#F5F3EE] text-[#0B0B0B] border-[#F5F3EE] font-semibold'
                        : 'bg-[#F5F3EE]/10 text-[#F5F3EE]/80 border-[#F5F3EE]/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Landing, Docs, Setup & Profile */}
      <div className="border-t border-[#F5F3EE]/10 pt-3 flex flex-col gap-1">
        <button
          id="nav-landing"
          type="button"
          onClick={() => handleItemClick('landing')}
          className="w-full flex items-center justify-between px-3 py-2.5 sm:py-1.5 text-[13px] rounded-md transition-all text-left min-h-[44px] sm:min-h-[36px] text-[#F5F3EE]/70 hover:text-[#F5F3EE] hover:bg-[#F5F3EE]/5"
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-[#F5F3EE]/60" />
            <span>Landing Page</span>
          </div>
          <span className="text-[10px] font-mono text-[#F5F3EE]/40 border border-[#F5F3EE]/20 px-1 rounded">
            Public
          </span>
        </button>

        <button
          id="nav-docs"
          type="button"
          onClick={() => handleItemClick('docs')}
          className="w-full flex items-center justify-between px-3 py-2.5 sm:py-1.5 text-[13px] rounded-md transition-all text-left min-h-[44px] sm:min-h-[36px] text-[#F5F3EE]/70 hover:text-[#F5F3EE] hover:bg-[#F5F3EE]/5"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#F5F3EE]/60" />
            <span>Docs & SDK</span>
          </div>
          <span className="text-[10px] font-mono text-[#F5F3EE]/40 border border-[#F5F3EE]/20 px-1 rounded">
            Public
          </span>
        </button>

        <button
          id="nav-pricing"
          type="button"
          onClick={() => handleItemClick('pricing')}
          className="w-full flex items-center justify-between px-3 py-2.5 sm:py-1.5 text-[13px] rounded-md transition-all text-left min-h-[44px] sm:min-h-[36px] text-[#F5F3EE]/70 hover:text-[#F5F3EE] hover:bg-[#F5F3EE]/5"
        >
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-[#F5F3EE]/60" />
            <span>Pricing</span>
          </div>
          <span className="text-[10px] font-mono text-[#F5F3EE]/40 border border-[#F5F3EE]/20 px-1 rounded">
            Public
          </span>
        </button>

        {/* User profile row */}
        <div className="mt-2 pt-3 border-t border-[#F5F3EE]/10 flex items-center justify-between px-2">
          <div className="flex items-center gap-2 min-w-0">
            {userSession?.avatarUrl ? (
              <img
                src={userSession.avatarUrl}
                alt={userSession.githubLogin}
                className="w-6 h-6 rounded-full border border-[#F5F3EE]/30 object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#F5F3EE]/15 border border-[#F5F3EE]/25 flex items-center justify-center text-[10px] font-mono text-[#F5F3EE] font-semibold flex-shrink-0">
                {userSession?.githubLogin ? userSession.githubLogin.slice(0, 2).toUpperCase() : '—'}
              </div>
            )}
            <div className="truncate text-left">
              <div className="text-[12px] text-[#F5F3EE] font-medium truncate leading-tight flex items-center gap-1.5">
                <span>{userSession?.githubLogin ? `@${userSession.githubLogin}` : 'Signed out'}</span>
                {userSession?.provider === 'github' && (
                  <Github className="w-3 h-3 text-[#F5F3EE]/60 flex-shrink-0" />
                )}
              </div>
              <div className="text-[10px] font-mono text-[#F5F3EE]/40 truncate">
                {userSession?.org || 'Not authenticated'}
              </div>
            </div>
          </div>

          <button
            id="sidebar-signout-btn"
            type="button"
            title="Sign out and go to Login page"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onShowLogin();
            }}
            className="p-1.5 text-[#F5F3EE]/40 hover:text-[#F5F3EE] hover:bg-[#F5F3EE]/10 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside 
        id="main-sidebar"
        className="hidden lg:flex w-64 flex-shrink-0 bg-[#0B0B0B] text-[#F5F3EE] flex-col justify-between border-r border-[#F5F3EE]/10 h-[100dvh] sticky top-0 select-none z-30 overflow-y-auto"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible when isMobileOpen is true) */}
      {isDrawerRendered && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-[#0B0B0B]/60 backdrop-blur-xs ${isDrawerClosing ? 'sidebar-backdrop-out' : 'sidebar-backdrop-in'}`}
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer sheet */}
          <aside
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className={`relative w-[min(300px,85vw)] max-w-full bg-[#0B0B0B] text-[#F5F3EE] flex flex-col justify-between border-r border-[#F5F3EE]/10 h-[100dvh] shadow-2xl z-10 overflow-y-auto ${isDrawerClosing ? 'sidebar-drawer-slide-out' : 'sidebar-drawer-slide-in'}`}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
