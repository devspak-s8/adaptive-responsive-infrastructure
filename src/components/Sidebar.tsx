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
  Github,
  Zap,
  CreditCard,
  LoaderCircle,
  ChevronDown,
  Check,
  Plus,
} from 'lucide-react';
import { PageType, ProjectItem, UserSession } from '../types';

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
  projects: ProjectItem[];
  currentProject: ProjectItem | null;
  onSelectProject: (project: ProjectItem) => void;
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
  projects,
  currentProject,
  onSelectProject,
}) => {
  const [isDrawerRendered, setIsDrawerRendered] = useState(isMobileOpen);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!isProjectMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const menus = document.querySelectorAll('[data-sidebar-project-menu]');
      if (!Array.from(menus).some((menu) => menu.contains(target))) setIsProjectMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProjectMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isProjectMenuOpen]);

  const handleItemClick = (page: PageType) => {
    setIsProjectMenuOpen(false);
    onNavigate(page);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleProjectSelect = (project: ProjectItem) => {
    onSelectProject(project);
    setIsProjectMenuOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const navItems: { id: PageType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'setup', label: 'Setup & SDK', icon: <Terminal className="w-4 h-4" /> },
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
    { id: 'pricing', label: 'Pricing', icon: <Zap className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const sidebarContent = (
    <div className="flex min-h-full flex-col p-4 sm:p-5 select-none safe-top safe-bottom">
      {/* Top section: Wordmark, Status & Navigation */}
      <div className="flex shrink-0 flex-col gap-5">
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

        {/* Active project context and switcher */}
        <div data-sidebar-project-menu className="relative rounded-lg border border-[#F5F3EE]/10 bg-[#F5F3EE]/[0.04] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#F5F3EE]/40">Active project</span>
            <button
              type="button"
              onClick={() => handleItemClick('projects')}
              className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#F5F3EE]/65 hover:text-[#F5F3EE]"
            >
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
          {projects.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setIsProjectMenuOpen((open) => !open)}
                aria-label="Switch active project"
                aria-haspopup="listbox"
                aria-expanded={isProjectMenuOpen}
                className="mt-2 flex w-full items-center justify-between gap-2 text-left text-xs font-mono font-semibold text-[#F5F3EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F3EE]/40"
              >
                <span className="truncate">{currentProject?.name ?? 'Select project'}</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-[#F5F3EE]/45 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProjectMenuOpen && (
                <div role="listbox" aria-label="Projects" className="absolute left-3 right-3 top-[calc(100%-2px)] z-50 mt-2 max-h-64 overflow-y-auto rounded-lg border border-[#F5F3EE]/15 bg-[#151515] p-1.5 shadow-2xl">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#F5F3EE]/40">Switch project</div>
                  {projects.map((project) => {
                    const isActive = project.id === currentProject?.id;
                    return (
                      <button
                        key={project.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => handleProjectSelect(project)}
                        className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2.5 text-left text-xs font-mono transition-colors ${isActive ? 'bg-[#F5F3EE] text-[#0B0B0B]' : 'text-[#F5F3EE]/75 hover:bg-[#F5F3EE]/10 hover:text-[#F5F3EE]'}`}
                      >
                        <span className="min-w-0 truncate">{project.name}</span>
                        <span className="flex shrink-0 items-center gap-1.5 text-[10px] opacity-70">
                          {project.environment}
                          {isActive && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <button type="button" onClick={() => handleItemClick('projects')} className="mt-2 flex w-full items-center justify-between text-left text-xs font-mono text-[#F5F3EE]/60 hover:text-[#F5F3EE]">
              <span>No project selected</span>
              <span className="text-[10px]">Create one</span>
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav aria-label="Main Navigation" className="flex flex-col gap-1">
          <div className="px-2 pb-1 text-[11px] font-mono uppercase tracking-wider text-[#F5F3EE]/40">
            Platform
          </div>
          {navItems.map((item) => {
            const isSelected = currentPage === item.id;
            const isBilling = item.id === 'billing';
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] rounded-md transition-all duration-150 text-left min-h-[42px] ${
                  isSelected
                    ? 'bg-[#F5F3EE]/15 text-[#F5F3EE] font-medium border border-[#F5F3EE]/20 shadow-xs'
                    : `text-[#F5F3EE]/70 hover:text-[#F5F3EE] hover:bg-[#F5F3EE]/5 ${isBilling ? 'border border-[#F5F3EE]/10 bg-[#F5F3EE]/[0.03]' : ''}`
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

      {/* Bottom section: Resources and profile */}
      <div className="mt-auto shrink-0 border-t border-[#F5F3EE]/10 pt-5 flex flex-col gap-1.5">
        <div className="px-3 pt-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#F5F3EE]/35">
          Resources
        </div>
        <button
          id="nav-docs"
          type="button"
          onClick={() => handleItemClick('docs')}
          className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] rounded-md transition-all text-left min-h-[40px] text-[#F5F3EE]/70 hover:text-[#F5F3EE] hover:bg-[#F5F3EE]/5"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#F5F3EE]/60" />
            <span>Docs & SDK</span>
          </div>
        </button>

        {/* User profile row */}
        <div className="mt-4 border-t border-[#F5F3EE]/10 pt-4">
          <div className="flex items-center gap-2.5 rounded-lg border border-[#F5F3EE]/10 bg-[#F5F3EE]/[0.04] p-3">
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
            <div className="min-w-0 flex-1 truncate text-left">
              <div className="text-[12px] text-[#F5F3EE] font-medium truncate leading-tight flex items-center gap-1.5">
                <span>{userSession?.githubLogin ? `@${userSession.githubLogin}` : 'Signed out'}</span>
                {userSession?.provider === 'github' && (
                  <Github className="w-3 h-3 text-[#F5F3EE]/60 flex-shrink-0" />
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono truncate">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${userSession?.isAuthenticated ? 'bg-emerald-300' : 'bg-[#F5F3EE]/35'}`} />
                <span className={userSession?.isAuthenticated ? 'text-emerald-200/90' : 'text-[#F5F3EE]/45'}>
                  {userSession?.isAuthenticated ? 'Authenticated' : 'Not authenticated'}
                </span>
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
              className="p-1.5 text-[#F5F3EE]/40 hover:text-[#F5F3EE] hover:bg-[#F5F3EE]/10 rounded transition-colors min-w-[34px] min-h-[34px] flex items-center justify-center flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside 
        id="main-sidebar"
        className="sidebar-scrollbar-hidden hidden lg:flex w-64 flex-shrink-0 bg-[#0B0B0B] text-[#F5F3EE] flex-col border-r border-[#F5F3EE]/10 h-[100dvh] sticky top-0 select-none z-30 overflow-y-auto overscroll-contain"
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
            className={`sidebar-scrollbar-hidden relative w-[min(300px,85vw)] max-w-full bg-[#0B0B0B] text-[#F5F3EE] flex flex-col border-r border-[#F5F3EE]/10 h-[100dvh] shadow-2xl z-10 overflow-y-auto overscroll-contain ${isDrawerClosing ? 'sidebar-drawer-slide-out' : 'sidebar-drawer-slide-in'}`}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
