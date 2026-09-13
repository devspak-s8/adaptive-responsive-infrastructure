import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Menu } from 'lucide-react';
import { PageType, ProjectItem } from '../types';

interface HeaderProps {
  currentPage: PageType;
  currentProject: ProjectItem | null;
  projects: ProjectItem[];
  onSelectProject: (project: ProjectItem) => void;
  onNavigate: (page: PageType) => void;
  onOpenMobileNav?: () => void;
}

const labels: Partial<Record<PageType, string>> = {
  overview: 'Overview', projects: 'Projects', issues: 'Issues', autofix: 'Autofix',
  'viewport-lab': 'Viewport Lab', deployments: 'Deployments', activity: 'Activity',
  settings: 'Settings', billing: 'Billing', setup: 'Setup & SDK',
};

export const Header: React.FC<HeaderProps> = ({
  currentPage, currentProject, projects, onSelectProject, onNavigate, onOpenMobileNav,
}) => {
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProjectMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!projectMenuRef.current?.contains(event.target as Node)) setIsProjectMenuOpen(false);
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

  const activeProject = projects.find((project) => project.id === currentProject?.id) ?? projects[0] ?? null;

  return <header id="app-header" className="h-14 border-b border-[#0B0B0B]/10 bg-[#F5F3EE] px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 w-full">
    <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-[#0B0B0B]/60 min-w-0 flex-1 mr-2">
      {onOpenMobileNav && (
        <button type="button" onClick={onOpenMobileNav} aria-label="Open navigation menu"
          className="lg:hidden p-1.5 -ml-1 text-[#0B0B0B] hover:bg-[#0B0B0B]/5 rounded-md min-w-[36px] min-h-[36px] flex items-center justify-center">
          <Menu className="w-4 h-4" />
        </button>
      )}
      <button type="button" onClick={() => onNavigate('projects')} className="hidden sm:inline hover:text-[#0B0B0B]">Projects</button>
      <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-[#0B0B0B]/30" />
      {projects.length > 0 ? (
        <div ref={projectMenuRef} className="relative min-w-0">
          <button
            type="button"
            aria-label="Select active project"
            aria-haspopup="listbox"
            aria-expanded={isProjectMenuOpen}
            onClick={() => setIsProjectMenuOpen((open) => !open)}
            className="flex items-center gap-1.5 max-w-[190px] min-h-[34px] px-2 py-1 rounded-md border border-transparent hover:border-[#0B0B0B]/15 hover:bg-[#0B0B0B]/[0.03] text-[#0B0B0B] font-medium font-mono text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0B]/25"
          >
            <span className="truncate">{activeProject ? `${activeProject.name} (${activeProject.environment})` : 'Select project'}</span>
            <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {isProjectMenuOpen && (
            <div role="listbox" aria-label="Projects" className="absolute left-0 top-[calc(100%+6px)] z-40 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#0B0B0B]/15 bg-[#fffdf8] p-1.5 shadow-[0_18px_45px_rgba(11,11,11,0.18)]">
              <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#0B0B0B]/45">Active project</div>
              {projects.map((project) => {
                const isActive = project.id === activeProject?.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => { onSelectProject(project); setIsProjectMenuOpen(false); }}
                    className={`w-full flex items-center justify-between gap-3 rounded-md px-2.5 py-2.5 text-left text-xs font-mono transition-colors ${isActive ? 'bg-[#0B0B0B] text-[#F5F3EE]' : 'text-[#0B0B0B] hover:bg-[#0B0B0B]/[0.06]'}`}
                  >
                    <span className="truncate">{project.name}</span>
                    <span className={`flex-shrink-0 text-[10px] ${isActive ? 'text-[#F5F3EE]/65' : 'text-[#0B0B0B]/45'}`}>{project.environment}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : <span className="text-[#0B0B0B]/50">No project selected</span>}
      {currentPage !== 'overview' && <><ChevronRight className="w-3.5 h-3.5 text-[#0B0B0B]/30" /><span className="text-[#0B0B0B] font-medium truncate">{labels[currentPage] ?? 'Dashboard'}</span></>}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {currentProject?.url && <a href={currentProject.url} target="_blank" rel="noreferrer" className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-[#0B0B0B]/70">
        <span className="truncate max-w-[120px]">{currentProject.url.replace(/^https?:\/\//, '')}</span><ExternalLink className="w-3 h-3" />
      </a>}
    </div>
  </header>;
};
